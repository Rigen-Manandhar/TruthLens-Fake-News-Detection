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
  reason_code?:
    | "CONFLICT"
    | "LOW_CONFIDENCE"
    | "INSUFFICIENT_TEXT"
    | "INPUT_TOO_LONG"
    | "FETCH_FAILED"
    | "UNSUPPORTED_URL"
    | null;
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

export type EvidenceSourceSignal = {
  domain?: string | null;
  known: boolean;
  source_type?: string | null;
  credibility?: string | null;
  category?: string | null;
  rationale?: string | null;
  last_reviewed?: string | null;
  reference_url?: string | null;
  notes?: string | null;
};

export type EvidenceSummary = {
  source_signal: EvidenceSourceSignal;
  evidence_status: "SOURCE_ONLY" | "NOT_CHECKED";
  limitations: string;
};

export type ExplanationWord = {
  word: string;
  weight: number;
  direction: "fake" | "real";
};

export type ExplanationSummary = {
  top_fake_words: ExplanationWord[];
  top_real_words: ExplanationWord[];
  model_used: "A" | "B" | null;
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
  evidenceSummary?: EvidenceSummary;
  explanationSummary?: ExplanationSummary;
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
  evidence_summary?: EvidenceSummary;
  explanation_summary?: ExplanationSummary;
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
