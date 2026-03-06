export const DETECTION_INPUT_MODES = [
  "auto",
  "headline_only",
  "full_article",
  "headline_plus_article",
] as const;

export type DetectionInputMode = (typeof DETECTION_INPUT_MODES)[number];

export const DETECTION_FEEDBACK_SOURCES = ["web", "extension"] as const;

export type DetectionFeedbackSource = (typeof DETECTION_FEEDBACK_SOURCES)[number];

export const MAX_FEEDBACK_COMMENT_LENGTH = 1000;

export type Step = {
  step: string;
  score_impact: number;
  details: string;
  sentence_preview?: string;
  input_preview?: string;
  metadata?: Record<string, unknown>;
};

export type UncertaintyInfo = {
  reason_code?: "CONFLICT" | "LOW_CONFIDENCE" | "INSUFFICIENT_TEXT" | "FETCH_FAILED" | null;
  reason_message?: string | null;
};

export type ParseMetadata = {
  used_mode: string;
  detected_shape: string;
  headline_word_count: number;
  body_word_count: number;
  headline_source?: string | null;
};

export type SingleModelOutput = {
  ran: boolean;
  label?: string | null;
  confidence?: number | null;
  score_impact?: number;
  input_word_count?: number;
};

export type ModelOutputs = {
  model_a: SingleModelOutput;
  model_b: SingleModelOutput;
};

export type ConflictInfo = {
  is_conflict: boolean;
  threshold?: number | null;
  raw_score_before_override?: number | null;
};

export type FetchMetadata = {
  attempted: boolean;
  success?: boolean | null;
  status_code?: number | null;
  error_type?: string | null;
  resolved_url?: string | null;
};

export type DetectionPredictionSnapshot = {
  verdict: string;
  riskLevel: string;
  finalScore: number;
  uncertainty?: UncertaintyInfo;
  parseMetadata?: ParseMetadata;
  modelOutputs?: ModelOutputs;
  conflict?: ConflictInfo;
  fetchMetadata?: FetchMetadata;
  limeModel?: "A" | "B" | null;
};

export type PredictResponse = {
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

export type DetectionPredictionInput = {
  text: string;
  url: string;
  input_mode: DetectionInputMode;
};

export type DetectionFeedbackChoice = {
  isCorrect: boolean;
  comment?: string;
};

export type DetectionFeedbackSubmission = {
  source: DetectionFeedbackSource;
  input: DetectionPredictionInput;
  prediction: DetectionPredictionSnapshot;
  feedback: DetectionFeedbackChoice;
};

export type ExtensionConfigState = {
  apiBaseUrl: string;
  bearerToken: string;
};

export const isDetectionInputMode = (
  value: unknown
): value is DetectionInputMode => {
  return (
    typeof value === "string" &&
    DETECTION_INPUT_MODES.includes(value as DetectionInputMode)
  );
};

export const isDetectionFeedbackSource = (
  value: unknown
): value is DetectionFeedbackSource => {
  return (
    typeof value === "string" &&
    DETECTION_FEEDBACK_SOURCES.includes(value as DetectionFeedbackSource)
  );
};
