"use client";
import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  ShieldCheck,
} from "lucide-react";

export default function AiQuizApp() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async (e) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic before generating your quiz.");
      return;
    }

    setLoading(true);
    setError("");
    setQuizData(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "We couldn’t generate your quiz right now.",
        );
      }

      setQuizData(data.quiz);
    } catch (err) {
      setError(
        err.message || "Something went wrong while generating your quiz.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionIdx, option) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  };

  const calculateScore = () => {
    if (!quizData) return 0;

    let score = 0;
    quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_40%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100 font-sans p-5 md:p-10 selection:bg-cyan-400 selection:text-slate-950">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-5 pt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-sm">
            <Sparkles size={16} />
            Powered by Google Gemini AI
          </div>

          <div className="space-y-3">
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-6xl">
              AI Quiz Generator
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-300 md:text-lg">
              Turn any topic into a polished, interactive quiz in seconds with
              smart, AI-generated questions and instant feedback.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left shadow-2xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="mb-2 inline-flex rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
              <Zap size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Instant generation
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Create tailored quiz sets from any subject.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left shadow-2xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="mb-2 inline-flex rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
              <ShieldCheck size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Smart answers
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Review correct responses and track performance.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left shadow-2xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="mb-2 inline-flex rounded-xl bg-violet-500/10 p-2 text-violet-300">
              <Brain size={18} />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Interactive review
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Learn from every answer with a clear breakdown.
            </p>
          </div>
        </div>

        <form
          onSubmit={generateQuiz}
          className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.6)] backdrop-blur md:flex-row"
        >
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Next.js App Router, C++ OOP, World History..."
            maxLength={200}
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            aria-label="Quiz topic"
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:scale-[1.01] hover:from-cyan-300 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Generating...
              </span>
            ) : (
              <>
                Generate Quiz <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {quizData && !isSubmitted && (
          <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30 md:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>
                Question {currentIndex + 1} of {quizData.length}
              </span>
              <span className="truncate text-cyan-300">{topic}</span>
            </div>

            <div className="mt-6 space-y-6">
              <h2 className="text-xl font-bold leading-snug text-slate-100 md:text-2xl">
                {quizData[currentIndex].question}
              </h2>

              <div className="space-y-3">
                {quizData[currentIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentIndex] === option;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOptionSelect(currentIndex, option)}
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm transition md:text-base ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                          : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                      }`}
                    >
                      <span>{option}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-400 text-slate-950"
                            : "border-slate-600 text-transparent"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {currentIndex < quizData.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitted(true)}
                  className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
                >
                  Submit & View Score
                </button>
              )}
            </div>
          </section>
        )}

        {quizData && isSubmitted && (
          <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30 md:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
              <Brain size={30} />
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold text-slate-100">
                Quiz Completed!
              </h2>
              <p className="text-sm text-slate-400">
                You scored on{" "}
                <span className="font-semibold text-cyan-300">{topic}</span>
              </p>
            </div>

            <div className="mt-6 inline-flex items-end justify-center rounded-2xl border border-slate-700 bg-slate-950 px-8 py-4 text-center">
              <span className="text-4xl font-black text-cyan-300">
                {calculateScore()}
              </span>
              <span className="ml-2 text-xl font-bold text-slate-500">
                / {quizData.length}
              </span>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-800 pt-6 text-left">
              {quizData.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start gap-3 font-semibold text-slate-200">
                      {isCorrect ? (
                        <CheckCircle
                          className="mt-0.5 shrink-0 text-emerald-400"
                          size={16}
                        />
                      ) : (
                        <XCircle
                          className="mt-0.5 shrink-0 text-red-400"
                          size={16}
                        />
                      )}
                      <span>
                        {idx + 1}. {q.question}
                      </span>
                    </div>

                    <div className="ml-7 mt-2 space-y-1 text-sm">
                      <p
                        className={
                          isCorrect ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        Your answer: {userAns || "No answer selected"}
                      </p>
                      {!isCorrect && (
                        <p className="text-cyan-300">
                          Correct answer: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setQuizData(null);
                setCurrentIndex(0);
                setSelectedAnswers({});
                setIsSubmitted(false);
                setTopic("");
                setError("");
              }}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:from-cyan-300 hover:to-sky-400"
            >
              <RotateCcw size={16} /> Generate Another Quiz
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
