"use client";

import { useEffect, useState } from "react";
import { normalizePreferences } from "@/lib/shared/settings";
import {
  MAX_FEEDBACK_COMMENT_LENGTH,
  type ConflictInfo,
  type DetectionInputMode,
  type ExplanationSummary,
  type FetchMetadata,
  type ModelOutputs,
  type ParseMetadata,
  type DetectionPredictionSnapshot,
  type EvidenceSummary,
  type PredictResponse,
  type Step,
  type UncertaintyInfo,
} from "@/lib/shared/detection-feedback";
import {
  buildPredictionSnapshot,
  INITIAL_RESULT_LABEL,
  isArticleRetrievalFailure,
  mapVerdictToDisplayLabel,
  mapVerdictToLevel,
  type CredibilityLevel,
  type ExplanationMode,
  type FeedbackStatus,
  type PredictPayload,
} from "./resultMapping";

export function useFakeDetectionController() {
  const [articleText, setArticleText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [inputMode, setInputMode] = useState<DetectionInputMode>("auto");
  const [preferredExplanationMode, setPreferredExplanationMode] =
    useState<"auto" | "none">("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultLevel, setResultLevel] = useState<CredibilityLevel>("mixed");
  const [resultLabel, setResultLabel] = useState(INITIAL_RESULT_LABEL);
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
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
  const [isTooLong, setIsTooLong] = useState(false);
  const [isFetchFailed, setIsFetchFailed] = useState(false);
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

  const resetResultState = () => {
    setResultLevel("mixed");
    setResultLabel(INITIAL_RESULT_LABEL);
    setIsTooShort(false);
    setIsTooLong(false);
    setIsFetchFailed(false);
    setResultDetails("");
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
    setExplanationSummary(undefined);
    setLimeModel(undefined);
    setFinalScore(undefined);
    setLastPayload(null);
    setPredictionSnapshot(null);
    setFeedbackSelection(null);
    setFeedbackComment("");
    setFeedbackStatus(null);
    setFeedbackSubmitted(false);
  };

  const applyPrediction = (data: PredictResponse, payload: PredictPayload) => {
    const level = mapVerdictToLevel(data.verdict);
    const tooShort = data.uncertainty?.reason_code === "INSUFFICIENT_TEXT";
    const tooLong = data.uncertainty?.reason_code === "INPUT_TOO_LONG";
    const fetchFailed = isArticleRetrievalFailure(data);
    const displayLabel = fetchFailed
      ? "Unable to fetch article"
      : tooShort
        ? "Too short"
        : tooLong
          ? "Too long"
          : mapVerdictToDisplayLabel(data.verdict);

    setResultLevel(level);
    setResultLabel(displayLabel);
    setFinalScore(typeof data.final_score === "number" ? data.final_score : undefined);
    setIsTooShort(tooShort);
    setIsTooLong(tooLong);
    setIsFetchFailed(fetchFailed);
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

    if (articleText.trim() && sourceUrl.trim()) {
      setError(
        "Use either pasted article text or a source URL, not both. Clear one field before assessing risk."
      );
      return;
    }

    const payload: PredictPayload = {
      text: articleText,
      url: sourceUrl,
      input_mode: inputMode,
    };

    setIsLoading(true);
    resetResultState();

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

  return {
    articleText,
    setArticleText,
    sourceUrl,
    setSourceUrl,
    inputMode,
    setInputMode,
    isLoading,
    isExplaining,
    error,
    resultLevel,
    resultLabel,
    finalScore,
    resultDetails,
    steps,
    explanation,
    analyzedText,
    explanationClass,
    uncertainty,
    parseMetadata,
    modelOutputs,
    conflict,
    fetchMetadata,
    evidenceSummary,
    limeModel,
    explanationSummary,
    lastPayload,
    predictionSnapshot,
    feedbackSelection,
    setFeedbackSelection,
    feedbackComment,
    setFeedbackComment,
    feedbackStatus,
    isSubmittingFeedback,
    feedbackSubmitted,
    analyze,
    handleExplain,
    submitFeedback,
    canShowFeedback:
      Boolean(lastPayload && predictionSnapshot) &&
      !isLoading &&
      !isTooShort &&
      !isTooLong &&
      !isFetchFailed &&
      !error,
    canExplain: Boolean(lastPayload) && !isTooShort && !isTooLong && !isFetchFailed && !error,
  };
}
