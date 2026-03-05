"use client";

import { useEffect, useState } from "react";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import Footer from "../components/Footer";
import { normalizePreferences } from "@/lib/shared/settings";

type CredibilityLevel = "high" | "mixed" | "low";
type InputMode = "auto" | "headline_only" | "full_article" | "headline_plus_article";
type ExplanationMode = "none" | "auto" | "force";

type Step = {
  step: string;
  score_impact: number;
  details: string;
  sentence_preview?: string;
  input_preview?: string;
  metadata?: Record<string, unknown>;
};

type UncertaintyInfo = {
  reason_code?: "CONFLICT" | "LOW_CONFIDENCE" | "INSUFFICIENT_TEXT" | "FETCH_FAILED" | null;
  reason_message?: string | null;
};

type ParseMetadata = {
  used_mode: string;
  detected_shape: string;
  headline_word_count: number;
  body_word_count: number;
  headline_source?: string | null;
};

type SingleModelOutput = {
  ran: boolean;
  label?: string | null;
  confidence?: number | null;
  score_impact?: number;
  input_word_count?: number;
};

type ModelOutputs = {
  model_a: SingleModelOutput;
  model_b: SingleModelOutput;
};

type ConflictInfo = {
  is_conflict: boolean;
  threshold?: number | null;
  raw_score_before_override?: number | null;
};

type FetchMetadata = {
  attempted: boolean;
  success?: boolean | null;
  status_code?: number | null;
  error_type?: string | null;
  resolved_url?: string | null;
};

type PredictResponse = {
  final_score: number;
  verdict: string;
  risk_level: string;
  steps: Step[];
  explanation?: [string, number][];
  explanation_html?: string;
  article_class?: string;
  uncertainty?: UncertaintyInfo;
  parse_metadata?: ParseMetadata;
  model_outputs?: ModelOutputs;
  conflict?: ConflictInfo;
  fetch_metadata?: FetchMetadata;
  lime_model?: "A" | "B" | null;
  lime_input_text?: string | null;
};

type PredictPayload = {
  text: string;
  url: string;
  input_mode: InputMode;
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
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [preferredExplanationMode, setPreferredExplanationMode] =
    useState<"auto" | "none">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultLevel, setResultLevel] = useState<CredibilityLevel>("mixed");
  const [resultLabel, setResultLabel] = useState("Input Text or URL to detect if the news is Fake or Real");
  const [riskLevel, setRiskLevel] = useState<string>("Needs Review");
  const [resultDetails, setResultDetails] = useState(
    "Paste some text and a source URL, then run an analysis to see a preview of credibility insights."
  );
  const [steps, setSteps] = useState<Step[] | undefined>(undefined);
  const [explanation, setExplanation] = useState<[string, number][] | undefined>(undefined);
  const [analyzedText, setAnalyzedText] = useState<string | undefined>(undefined);
  const [explanationClass, setExplanationClass] = useState<string | undefined>(undefined);
  const [uncertainty, setUncertainty] = useState<UncertaintyInfo | undefined>(undefined);
  const [parseMetadata, setParseMetadata] = useState<ParseMetadata | undefined>(undefined);
  const [modelOutputs, setModelOutputs] = useState<ModelOutputs | undefined>(undefined);
  const [conflict, setConflict] = useState<ConflictInfo | undefined>(undefined);
  const [fetchMetadata, setFetchMetadata] = useState<FetchMetadata | undefined>(undefined);
  const [limeModel, setLimeModel] = useState<"A" | "B" | null | undefined>(undefined);
  const [lastPayload, setLastPayload] = useState<PredictPayload | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as {
          user?: { preferences?: unknown };
        };
        const prefs = normalizePreferences(data.user?.preferences);

        if (!mounted) {
          return;
        }

        setInputMode(prefs.detectionInputMode);
        setPreferredExplanationMode(prefs.detectionExplanationMode);
      } catch {
        // Ignore for unauthenticated users.
      }
    };

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const applyPrediction = (data: PredictResponse, payload: PredictPayload) => {
    const level = mapVerdictToLevel(data.verdict);

    setResultLevel(level);
    setResultLabel(`${data.verdict}`);
    setRiskLevel(data.risk_level ?? "Needs Review");
    setResultDetails(data.uncertainty?.reason_message ?? "");
    setSteps(data.steps);
    setExplanation(data.explanation);
    setAnalyzedText(data.lime_input_text ?? payload.text);
    setExplanationClass(data.article_class);
    setUncertainty(data.uncertainty);
    setParseMetadata(data.parse_metadata);
    setModelOutputs(data.model_outputs);
    setConflict(data.conflict);
    setFetchMetadata(data.fetch_metadata);
    setLimeModel(data.lime_model);
    setLastPayload(payload);
  };

  const runPrediction = async (payload: PredictPayload, explanationMode: ExplanationMode) => {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        explanation_mode: explanationMode,
      }),
    });

    const json = (await res.json().catch(() => null)) as
      | (PredictResponse & { detail?: string })
      | null;

    if (!res.ok) {
      const detail = json?.detail ?? "Prediction failed";
      throw new Error(typeof detail === "string" ? detail : "Prediction failed");
    }

    return json as PredictResponse;
  };

  const analyze = async () => {
    setError(null);

    if (!articleText.trim() && !sourceUrl.trim()) {
      setError("Please enter some article text or a source URL to analyse.");
      return;
    }

    const payload: PredictPayload = {
      text: articleText,
      url: sourceUrl,
      input_mode: inputMode,
    };

    setIsLoading(true);
    setSteps(undefined);
    setExplanation(undefined);
    setAnalyzedText(undefined);
    setExplanationClass(undefined);
    setUncertainty(undefined);
    setParseMetadata(undefined);
    setModelOutputs(undefined);
    setConflict(undefined);
    setFetchMetadata(undefined);
    setLimeModel(undefined);

    try {
      const data = await runPrediction(payload, preferredExplanationMode);
      applyPrediction(data, payload);
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

  const handleExplain = async () => {
    if (!lastPayload || isExplaining) {
      return;
    }

    setError(null);
    setIsExplaining(true);
    try {
      const data = await runPrediction(lastPayload, "force");
      applyPrediction(data, lastPayload);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to generate explanation. Please try again.";
      setError(message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-14 -left-16 h-64 w-64 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -right-12 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <header className="space-y-4 max-w-2xl">
          <div className="space-y-4">
            <h1 className="display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Fake News Detection
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-xl">
              Combine source credibility, headline signals, and deep-learning analysis to assess risk in minutes.
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[#12100d]/45" />
              Hybrid model + source credibility checks
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2 items-start">
          <FakeDetectionForm
            articleText={articleText}
            sourceUrl={sourceUrl}
            inputMode={inputMode}
            isLoading={isLoading}
            error={error}
            onArticleChange={setArticleText}
            onSourceUrlChange={setSourceUrl}
            onInputModeChange={setInputMode}
            onAnalyze={analyze}
          />

          <FakeDetectionResult
            level={resultLevel}
            label={resultLabel}
            details={resultDetails}
            riskLevel={riskLevel}
            steps={steps}
            explanation={explanation}
            analyzedText={analyzedText}
            explanationClass={explanationClass}
            uncertainty={uncertainty}
            parseMetadata={parseMetadata}
            modelOutputs={modelOutputs}
            conflict={conflict}
            fetchMetadata={fetchMetadata}
            limeModel={limeModel}
            canExplain={Boolean(lastPayload)}
            isExplaining={isExplaining}
            onExplain={handleExplain}
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
