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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return NextResponse.json(
      { error: "Quiz generation is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `Create exactly five accurate, engaging multiple-choice quiz questions about: "${topic}". Each question must have exactly four distinct answer options and one correct answer that exactly matches one of those options. Make the questions specific to the topic and suitable for a general learner.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUIZ_SCHEMA,
      },
    });

    let quiz;
    try {
      quiz = JSON.parse(response.text || "");
    } catch {
      console.error("Gemini returned a response that was not valid JSON.");
      return NextResponse.json(
        { error: "The AI returned an invalid quiz. Please try again." },
        { status: 502 },
      );
    }

    if (!isValidQuiz(quiz)) {
      console.error("Gemini returned quiz data that did not match the schema.");
      return NextResponse.json(
        { error: "The AI returned an incomplete quiz. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Gemini quiz generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate a quiz right now. Please try again." },
      { status: 502 },
    );
  }
}
