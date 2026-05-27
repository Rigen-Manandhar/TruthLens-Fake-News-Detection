import type {
  DetectionPredictionInput,
  DetectionPredictionSnapshot,
  PredictResponse,
} from "@/lib/shared/detection-feedback";

export type CredibilityLevel = "high" | "mixed" | "low";
export type ExplanationMode = "none" | "auto" | "force";
export type FeedbackStatus = { type: "success" | "error"; message: string } | null;
export type PredictPayload = DetectionPredictionInput;

export const INITIAL_RESULT_LABEL =
  "Paste text or a URL to assess misinformation risk";

export const mapVerdictToLevel = (verdict: string): CredibilityLevel => {
  const v = verdict.toUpperCase();
  if (v === "SUSPICIOUS") return "low";
  if (v === "LIKELY REAL") return "high";
  return "mixed";
};

export const mapVerdictToDisplayLabel = (verdict: string): string => {
  const v = verdict.toUpperCase();
  if (v === "SUSPICIOUS") return "Higher Risk";
  if (v === "LIKELY REAL") return "Lower Risk";
  return "Needs Review";
};

export const isArticleRetrievalFailure = (data: PredictResponse): boolean => {
  const reasonCode = data.uncertainty?.reason_code;
  return (
    reasonCode === "FETCH_FAILED" ||
    reasonCode === "UNSUPPORTED_URL" ||
    (data.fetch_metadata?.attempted === true &&
      data.fetch_metadata.success === false)
  );
};

export const buildPredictionSnapshot = (
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
