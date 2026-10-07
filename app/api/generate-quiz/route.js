import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const QUIZ_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      correctAnswer: { type: Type.STRING },
    },
    required: ["question", "options", "correctAnswer"],
  },
};

function isValidQuiz(quiz) {
  return (
    Array.isArray(quiz) &&
    quiz.length === 5 &&
    quiz.every(
      (item) =>
        item &&
        typeof item.question === "string" &&
        item.question.trim() &&
        Array.isArray(item.options) &&
        item.options.length === 4 &&
        item.options.every(
          (option) => typeof option === "string" && option.trim(),
        ) &&
        typeof item.correctAnswer === "string" &&
        item.options.includes(item.correctAnswer),
    )
  );
}

// Fast models first; later entries are fallbacks if a model is overloaded.
const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
].filter((model, idx, list) => model && list.indexOf(model) === idx);

// Keep the whole request well under the serverless function time limit.
const ATTEMPT_TIMEOUT_MS = 12000;
const TOTAL_BUDGET_MS = 22000;

function getClients() {
  const clients = [];

  // A Gemini key may be set manually or injected by Netlify AI Gateway.
  if (process.env.GEMINI_API_KEY) {
    const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL;
    clients.push(
      new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        ...(baseUrl ? { httpOptions: { baseUrl } } : {}),
      }),
    );
  }

  // The AI Gateway credentials are always available on Netlify.
  if (process.env.NETLIFY_AI_GATEWAY_KEY) {
    clients.push(
      new GoogleGenAI({
        apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
        httpOptions: {
          baseUrl: process.env.NETLIFY_AI_GATEWAY_BASE_URL?.replace(/\/$/, ""),
        },
      }),
    );
  }

  return clients;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please provide a valid request." },
      { status: 400 },
    );
  }

  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";

  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  if (topic.length > 200) {
    return NextResponse.json(
      { error: "Please keep the topic under 200 characters." },
      { status: 400 },
    );
  }

  const clients = getClients();
  if (!clients.length) {
    console.error("No Gemini API key or AI Gateway key is configured.");
    return NextResponse.json(
      { error: "Quiz generation is not configured on the server." },
      { status: 500 },
    );
  }

  const prompt = `Create exactly five accurate, engaging multiple-choice quiz questions about: "${topic}". Each question must have exactly four distinct answer options and one correct answer that exactly matches one of those options. Make the questions specific to the topic and suitable for a general learner.`;
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of MODELS) {
    for (const ai of clients) {
      const remaining = deadline - Date.now();
      if (remaining < 2000) break;

      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: QUIZ_SCHEMA,
            httpOptions: {
              timeout: Math.min(ATTEMPT_TIMEOUT_MS, remaining),
              retryOptions: { attempts: 1 },
            },
          },
        });

        let quiz;
        try {
          quiz = JSON.parse(response.text || "");
        } catch {
          console.error(
            `${model} returned a response that was not valid JSON.`,
          );
          continue;
        }

        if (!isValidQuiz(quiz)) {
          console.error(
            `${model} returned quiz data that did not match the schema.`,
          );
          continue;
        }

        return NextResponse.json({ quiz });
      } catch (error) {
        console.error(
          `Gemini quiz generation failed with ${model}:`,
          error?.message || error,
        );
      }
    }
  }

  return NextResponse.json(
    { error: "Could not generate a quiz right now. Please try again." },
    { status: 502 },
  );
}
