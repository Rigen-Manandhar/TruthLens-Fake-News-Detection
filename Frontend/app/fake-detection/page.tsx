"use client";

import { useState } from "react";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import Footer from "../components/Footer";

type CredibilityLevel = "high" | "mixed" | "low";

type Step = {
  step: string;
  score_impact: number;
  details: string;
  sentence_preview?: string;
};

type PredictResponse = {
  final_score: number;
  verdict: string;
  risk_level: string;
  steps: Step[];
  explanation?: [string, number][];
  explanation_html?: string;
  article_class?: string;
};

const mapVerdictToLevel = (verdict: string): CredibilityLevel => {
  const v = verdict.toUpperCase();
  if (v === "SUSPICIOUS") return "low";
  if (v === "LIKELY REAL") return "high";
  return "mixed";
};

export default function FakeDetectionPage() {
  const [articleText, setArticleText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultLevel, setResultLevel] = useState<CredibilityLevel>("mixed");
  const [resultLabel, setResultLabel] = useState("Input Text or URL to detect if the news is Fake or Real");
  const [resultDetails, setResultDetails] = useState(
    "Paste some text and a source URL, then run an analysis to see a preview of credibility insights."
  );
  // We'll treat 'explanation' as 'steps' for now, but better to update the Result component next.
  // For now, I will pass steps as "details" text formatted nicely.
  const [steps, setSteps] = useState<Step[] | undefined>(undefined);
  const [explanation, setExplanation] = useState<[string, number][] | undefined>(undefined);
  const [analyzedText, setAnalyzedText] = useState<string | undefined>(undefined);
  const [explanationClass, setExplanationClass] = useState<string | undefined>(undefined);

  const analyze = async () => {
    setError(null);

    // Require either text or URL
    if (!articleText.trim() && !sourceUrl.trim()) {
      setError("Please enter some article text or a source URL to analyse.");
      return;
    }

    setIsLoading(true);
    setSteps(undefined);
    setExplanation(undefined);
    setAnalyzedText(undefined);
    setExplanationClass(undefined);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: articleText,
          url: sourceUrl
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Prediction failed");
      }

      const data = (await res.json()) as PredictResponse;

      const level = mapVerdictToLevel(data.verdict);

      setResultLevel(level);
      setResultLabel(`${data.verdict}`);
      setResultDetails("");
      setSteps(data.steps);
      setExplanation(data.explanation);
      setAnalyzedText(articleText);
      setExplanationClass(data.article_class);

    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Something went wrong while analysing. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-[radial-gradient(120%_120%_at_0%_0%,#f8fafc_0%,#ffffff_55%,#f1f5f9_100%)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-sky-100 via-white to-emerald-100 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-amber-100 via-white to-sky-100 blur-3xl opacity-70" />

      <main className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.25em] text-gray-500 uppercase shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              Analysis tools
            </div>
            <h1 className="text-3xl sm:text-[2.4rem] font-semibold text-gray-900 leading-tight tracking-tight">
              Fake News Detection
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl">
              Combine source credibility, headline signals, and deep-learning analysis to assess risk in minutes.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-900/30" />
              Hybrid model + source credibility checks
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-gray-400 uppercase">
              How it works
            </p>
            <div className="mt-4 grid gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500/70" />
                <p>Scan the source domain against a curated credibility list.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500/70" />
                <p>Evaluate headline and full article signals with AI.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500/70" />
                <p>Generate an explanation map to highlight key phrases.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2 items-start">
          <FakeDetectionForm
            articleText={articleText}
            sourceUrl={sourceUrl}
            isLoading={isLoading}
            error={error}
            onArticleChange={setArticleText}
            onSourceUrlChange={setSourceUrl}
            onAnalyze={analyze}
          />

          <FakeDetectionResult
            level={resultLevel}
            label={resultLabel}
            details={resultDetails}
            steps={steps}
            explanation={explanation}
            analyzedText={analyzedText}
            explanationClass={explanationClass}
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
