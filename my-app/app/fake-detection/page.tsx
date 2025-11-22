"use client";

import { useState } from "react";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import Footer from "../components/Footer";

type CredibilityLevel = "high" | "mixed" | "low";

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

  const analyze = async () => {
    setError(null);

    if (!articleText.trim() && !sourceUrl.trim()) {
      setError("Please enter some article text or a source URL to analyse.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace this mock with a real call to your FastAPI (or other) backend.
      // Example:
      // const response = await fetch(process.env.NEXT_PUBLIC_FAKE_API_URL!, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ text: articleText, url: sourceUrl }),
      // });
      // const data = await response.json();
      // setResultLevel(data.level);
      // setResultLabel(data.label);
      // setResultDetails(data.details);

      await new Promise((resolve) => setTimeout(resolve, 700));

      const lower = articleText.toLowerCase();
      let level: CredibilityLevel = "mixed";
      let label = "Mixed credibility";
      let details =
        "Some signals suggest this content may mix factual reporting with opinion or unverified claims. Treat with caution and cross‑check with reputable sources.";

      if (lower.includes("breaking") || lower.includes("shocking")) {
        level = "low";
        label = "Potentially misleading";
        details =
          "The language in this article uses sensational phrases often associated with clickbait or low‑credibility sources. Verify key claims with multiple trusted outlets.";
      } else if (lower.includes("report") || lower.includes("according to")) {
        level = "high";
        label = "Likely credible";
        details =
          "The writing style and phrasing resemble conventional reporting. Still, always check the original publisher and look for independent confirmation.";
      }

      setResultLevel(level);
      setResultLabel(label);
      setResultDetails(details);
    } catch (e) {
      setError("Something went wrong while analysing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
            Analysis tools
          </p>
          <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-gray-900 leading-tight tracking-tight">
            Fake News Detection
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Paste an article excerpt and an optional source URL to get an
            AI-assisted credibility preview. Later, this will connect to your
            FastAPI backend for full model scoring.
          </p>
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
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
