"use client";

import { useEffect, useState } from "react";
import DetectionFeedbackCard from "../components/fakeDetection/DetectionFeedbackCard";
import FakeDetectionForm from "../components/fakeDetection/FakeDetectionForm";
import FakeDetectionResult from "../components/fakeDetection/FakeDetectionResult";
import Footer from "../components/Footer";
import { normalizePreferences } from "@/lib/shared/settings";
import {
  MAX_FEEDBACK_COMMENT_LENGTH,
  type ConflictInfo,
  type DetectionInputMode,
  type ExplanationSummary,
  type FetchMetadata,
  type ModelOutputs,
  type ParseMetadata,
  type DetectionPredictionInput,
  type DetectionPredictionSnapshot,
  type EvidenceSummary,
  type PredictResponse,
  type Step,
  type UncertaintyInfo,
} from "@/lib/shared/detection-feedback";

type CredibilityLevel = "high" | "mixed" | "low";
type ExplanationMode = "none" | "auto" | "force";
type FeedbackStatus = { type: "success" | "error"; message: string } | null;
type PredictPayload = DetectionPredictionInput;

const mapVerdictToLevel = (verdict: string): CredibilityLevel => {
  const v = verdict.toUpperCase();
  if (v === "SUSPICIOUS") return "low";
  if (v === "LIKELY REAL") return "high";
  return "mixed";
};

const mapVerdictToDisplayLabel = (verdict: string): string => {
  const v = verdict.toUpperCase();
  if (v === "SUSPICIOUS") return "Higher Risk";
  if (v === "LIKELY REAL") return "Lower Risk";
  return "Needs Review";
};

const buildPredictionSnapshot = (
  data: PredictResponse
): DetectionPredictionSnapshot => ({
  verdict: data.verdict,
  riskLevel: data.risk_level ?? "Needs Review",
  finalScore: data.final_score,
  uncertainty: data.uncertainty,
  parseMetadata: data.parse_metadata,
  modelOutputs: data.model_outputs,
  conflict: data.conflict,
  fetchMetadata: data.fetch_metadata,
  evidenceSummary: data.evidence_summary,
  explanationSummary: data.explanation_summary,
  limeModel: data.lime_model ?? null,
});

export default function FakeDetectionPage() {
  const [articleText, setArticleText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [inputMode, setInputMode] = useState<DetectionInputMode>("auto");
  const [preferredExplanationMode, setPreferredExplanationMode] =
    useState<"auto" | "none">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultLevel, setResultLevel] = useState<CredibilityLevel>("mixed");
  const [resultLabel, setResultLabel] = useState("Paste text or a URL to assess misinformation risk");
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
  const [evidenceSummary, setEvidenceSummary] = useState<EvidenceSummary | undefined>(undefined);
  const [limeModel, setLimeModel] = useState<"A" | "B" | null | undefined>(undefined);
  const [explanationSummary, setExplanationSummary] = useState<ExplanationSummary | undefined>(undefined);
  const [isTooShort, setIsTooShort] = useState(false);
  const [lastPayload, setLastPayload] = useState<PredictPayload | null>(null);
  const [predictionSnapshot, setPredictionSnapshot] =
    useState<DetectionPredictionSnapshot | null>(null);
  const [feedbackSelection, setFeedbackSelection] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
    const tooShort = data.uncertainty?.reason_code === "INSUFFICIENT_TEXT";

    setResultLevel(level);
    setResultLabel(tooShort ? "Too short" : mapVerdictToDisplayLabel(data.verdict));
    setRiskLevel(tooShort ? "Too short" : (data.risk_level ?? "Needs Review"));
    setIsTooShort(tooShort);
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
    setEvidenceSummary(data.evidence_summary);
    setExplanationSummary(data.explanation_summary);
    setLimeModel(data.lime_model);
    setLastPayload(payload);
    setPredictionSnapshot(buildPredictionSnapshot(data));
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
    setEvidenceSummary(undefined);
    setLimeModel(undefined);
    setLastPayload(null);
    setPredictionSnapshot(null);
    setFeedbackSelection(null);
    setFeedbackComment("");
    setFeedbackStatus(null);
    setFeedbackSubmitted(false);

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

  const submitFeedback = async () => {
    if (!lastPayload || !predictionSnapshot) {
      return;
    }

    if (feedbackSelection === null) {
      setFeedbackStatus({
        type: "error",
        message: "Choose whether the prediction was right or wrong before sending feedback.",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const res = await fetch("/api/feedback/detections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "web",
          input: lastPayload,
          prediction: predictionSnapshot,
          feedback: {
            isCorrect: feedbackSelection,
            comment: feedbackComment.slice(0, MAX_FEEDBACK_COMMENT_LENGTH),
          },
        }),
      });

      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to submit feedback.");
      }

      setFeedbackSubmitted(true);
      setFeedbackStatus({
        type: "success",
        message: "Thanks. Your feedback was saved.",
      });
    } catch (submitError) {
      setFeedbackStatus({
        type: "error",
        message:
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit feedback.",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-14 -left-16 h-64 w-64 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-12 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main id="main-content" className="page-main space-y-8 sm:space-y-10">
        <header className="space-y-4 max-w-2xl">
          <div className="space-y-4">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Misinformation Risk Assessment
            </h1>
            <p className="text-sm sm:text-base text-(--muted-foreground) max-w-xl">
              Combine source credibility, article extraction, language signals, and evidence hints to assess misinformation risk.
            </p>
            <div className="flex items-center gap-3 text-xs text-(--muted-foreground)">
              <span className="h-2 w-2 rounded-full bg-[#12100d]/45" />
              Hybrid evidence and risk analysis
            </div>
          </div>
        </header>

        <section className="grid items-start gap-6 xl:grid-cols-2">
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

          <div className="space-y-6 xl:flex xl:h-full xl:flex-col">
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
              evidenceSummary={evidenceSummary}
              explanationSummary={explanationSummary}
              limeModel={limeModel}
              canExplain={Boolean(lastPayload) && !isTooShort && !error}
              isExplaining={isExplaining}
              onExplain={handleExplain}
            />

            {lastPayload && predictionSnapshot && !isLoading && !isTooShort && !error && (
              <DetectionFeedbackCard
                selectedValue={feedbackSelection}
                comment={feedbackComment}
                isSubmitting={isSubmittingFeedback}
                isSubmitted={feedbackSubmitted}
                status={feedbackStatus}
                onSelect={setFeedbackSelection}
                onCommentChange={setFeedbackComment}
                onSubmit={submitFeedback}
              />
            )}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
