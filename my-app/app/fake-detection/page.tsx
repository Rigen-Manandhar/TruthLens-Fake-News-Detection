"use client";

import { useState } from "react";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import Footer from "../components/Footer";

type CredibilityLevel = "high" | "mixed" | "low";

type PredictResponse = {
  label: string;
  confidence: number;
  explanation?: [string, number][];
  explanation_html?: string;
};

const mapLabelToLevel = (label: string): CredibilityLevel => {
  const l = (label || "").toLowerCase();

  // Adjust these if your backend uses different label names
  if (l.includes("fake") || l.includes("false")) return "low";
  if (l.includes("real") || l.includes("true")) return "high";

  return "mixed";
};

export default function FakeDetectionPage() {
  const [articleText, setArticleText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultLevel, setResultLevel] = useState<CredibilityLevel>("mixed");
  const [resultLabel, setResultLabel] = useState("Mixed credibility");
  const [resultDetails, setResultDetails] = useState(
    "Paste some text and a source URL, then run an analysis to see a preview of credibility insights."
  );
  const [explanation, setExplanation] = useState<[string, number][] | undefined>(undefined);
  const [analyzedText, setAnalyzedText] = useState<string | undefined>(undefined);

  const analyze = async () => {
    setError(null);

    if (!articleText.trim() && !sourceUrl.trim()) {
      setError("Please enter some article text or a source URL to analyse.");
      return;
    }

    // Since you said you'll mainly use /predict-text, require text
    if (!articleText.trim()) {
      setError("Please enter some article text to analyse.");
      return;
    }

    setIsLoading(true);

    try {
      // Calls your Next.js proxy route: app/api/predict/route.ts
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: articleText,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Prediction failed");
      }

      const data = (await res.json()) as PredictResponse;

      const level = mapLabelToLevel(data.label);
      const pct = (data.confidence * 100).toFixed(2);

      let details =
        level === "high"
          ? `Model thinks this looks like legitimate reporting.\nConfidence: ${pct}%.\n\nTip: Cross-check key claims with another reputable outlet.`
          : level === "low"
            ? `Model flags this as likely misinformation.\nConfidence: ${pct}%.\n\nTip: Check the source, date, and whether other outlets confirm it.`
            : `Model is uncertain / mixed.\nConfidence: ${pct}%.\n\nTip: The text may be missing context; verify with multiple sources.`;

      if (sourceUrl.trim()) {
        details += `\n\nSource URL provided: ${sourceUrl}\n(Note: current model call uses text only.)`;
      }

      setResultLevel(level);
      setResultLabel(`${data.label} (${pct}%)`);
      setResultDetails(details);
      setExplanation(data.explanation);
      setAnalyzedText(articleText); // Store the text that was analyzed
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
            explanation={explanation}
            analyzedText={analyzedText}
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
