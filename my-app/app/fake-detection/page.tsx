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
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
            Analysis tools
          </p>
          <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-gray-900 leading-tight tracking-tight">
            Fake News Detection
          </h1>
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
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
