type CredibilityLevel = "high" | "mixed" | "low";

interface Step {
  step: string;
  score_impact: number;
  details: string;
  sentence_preview?: string;
  input_preview?: string;
}

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

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
  riskLevel?: string;
  steps?: Step[];
  explanation?: [string, number][];
  analyzedText?: string;
  explanationClass?: string;
  uncertainty?: UncertaintyInfo;
  parseMetadata?: ParseMetadata;
  modelOutputs?: ModelOutputs;
  conflict?: ConflictInfo;
  fetchMetadata?: FetchMetadata;
  limeModel?: "A" | "B" | null;
  canExplain?: boolean;
  isExplaining?: boolean;
  onExplain?: () => void;
}

const levelStyles: Record<CredibilityLevel, string> = {
  high: "bg-emerald-50 text-emerald-800 border-emerald-100",
  mixed: "bg-amber-50 text-amber-800 border-amber-100",
  low: "bg-red-50 text-red-800 border-red-100",
};

const reasonLabelMap: Record<string, string> = {
  CONFLICT: "Conflict",
  LOW_CONFIDENCE: "Low confidence",
  INSUFFICIENT_TEXT: "Insufficient text",
  FETCH_FAILED: "Fetch failed",
};

const toFriendlyStepMessage = (step: Step): string => {
  if (step.step === "Source Check") {
    if (step.details.includes("No URL provided")) {
      return "Source credibility check was skipped because no URL was provided.";
    }
    return "We checked the source domain credibility.";
  }

  if (step.step === "URL Extraction") {
    return "We attempted to fetch article content from the provided URL.";
  }

  if (step.step === "Headline Check") {
    if (step.details.startsWith("Skipped")) {
      return "Headline analysis was skipped for this input.";
    }
    return "We analyzed the headline signal.";
  }

  if (step.step === "Article Check") {
    if (step.details.startsWith("Skipped")) {
      return "Article analysis was skipped due to limited article text.";
    }
    return "We analyzed the full article content.";
  }

  return "Additional analysis checks were applied.";
};

export default function FakeDetectionResult({
  level,
  label,
  details,
  riskLevel,
  steps,
  explanation,
  analyzedText,
  explanationClass,
  uncertainty,
  limeModel,
  canExplain = false,
  isExplaining = false,
  onExplain,
}: FakeDetectionResultProps) {
  const hasResult = label !== "Input Text or URL to detect if the news is Fake or Real";
  const uncertaintyReason = uncertainty?.reason_code
    ? reasonLabelMap[uncertainty.reason_code] ?? uncertainty.reason_code
    : null;
  const visibleSteps = (steps ?? []).filter((step) => step.step !== "Input Parsing");

  const renderHighlightedText = () => {
    if (!analyzedText || !explanation || explanation.length === 0) {
      return null;
    }

    const normalizedClass = (explanationClass ?? "").toUpperCase();
    let colorMode: "fake" | "real" | "neutral" = "neutral";
    if (normalizedClass.includes("FAKE") || normalizedClass.includes("FALSE")) {
      colorMode = "fake";
    } else if (normalizedClass.includes("REAL") || normalizedClass.includes("TRUE")) {
      colorMode = "real";
    } else if (level === "low") {
      colorMode = "fake";
    } else if (level === "high") {
      colorMode = "real";
    }

    const weightMap = new Map(
      explanation.map(([word, weight]) => [word.toLowerCase(), weight])
    );

    const tokens = analyzedText.split(/(\s+)/);

    return (
      <div className="text-sm leading-relaxed mb-6 font-serif">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide font-sans">
            Deep Learning Analysis (LIME{limeModel ? ` - Model ${limeModel}` : ""})
          </h4>
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={isExplaining}
              className="inline-flex h-7 items-center rounded-full border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExplaining ? "Explaining..." : "Explain"}
            </button>
          )}
        </div>
        <div className="p-3 bg-gray-50/50 rounded-xl border border-dotted border-gray-300">
          {tokens.map((token, idx) => {
            const cleanWord = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const weight = weightMap.get(cleanWord);

            if (weight === undefined) {
              return <span key={idx}>{token}</span>;
            }

            const isPositive = weight >= 0;
            let bgColor = "transparent";
            let textColor = "inherit";

            if (colorMode === "fake") {
              if (isPositive) {
                bgColor = "rgba(239, 68, 68, 0.2)";
                textColor = "#991b1b";
              } else {
                bgColor = "rgba(34, 197, 94, 0.2)";
                textColor = "#166534";
              }
            } else if (colorMode === "real") {
              if (isPositive) {
                bgColor = "rgba(34, 197, 94, 0.2)";
                textColor = "#166534";
              } else {
                bgColor = "rgba(239, 68, 68, 0.2)";
                textColor = "#991b1b";
              }
            } else {
              if (isPositive) {
                bgColor = "rgba(34, 197, 94, 0.2)";
                textColor = "#166534";
              } else {
                bgColor = "rgba(239, 68, 68, 0.2)";
                textColor = "#991b1b";
              }
            }

            return (
              <span
                key={idx}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  padding: "1px 2px",
                  borderRadius: "2px",
                  fontWeight: 600,
                }}
                title={`Weight: ${weight.toFixed(4)}`}
              >
                {token}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="relative flex flex-col rounded-3xl bg-white/90 backdrop-blur border border-white/60 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)] px-6 sm:px-8 py-6 sm:py-7 h-[600px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />

      <div className="relative flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
          >
            {hasResult ? `Result: ${label}` : label}
          </div>
          {riskLevel && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              Risk: {riskLevel}
            </span>
          )}
          <span className="text-xs text-gray-400">Hybrid credibility analysis</span>
        </div>

        {hasResult && (
          <p className="mt-4 text-sm text-gray-700 leading-relaxed font-medium">
            {level === "high" &&
              "The hybrid model analysis indicates this content is likely credible and authentic."}
            {level === "low" &&
              "The analysis detected strong indicators commonly associated with misleading or fabricated content."}
            {level === "mixed" &&
              "The model detected mixed signals and marked this content for review."}
          </p>
        )}

        <div className="mt-6 flex-1 min-h-0 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 overflow-y-auto">
          {uncertaintyReason && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wide">
                Reason: {uncertaintyReason}
              </p>
              {uncertainty?.reason_message && (
                <p className="mt-1 text-amber-800">{uncertainty.reason_message}</p>
              )}
            </div>
          )}

          {details && !uncertainty?.reason_message && (
            <div className="whitespace-pre-wrap mb-4 text-xs text-gray-600">{details}</div>
          )}

          {visibleSteps.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide">
                What we checked
              </h4>
              {visibleSteps.map((stepItem, index) => (
                <div
                  key={`${stepItem.step}-${index}`}
                  className="rounded-xl border border-gray-200 bg-white/80 px-3 py-3"
                >
                  <div className="text-xs font-semibold text-gray-700">
                    {stepItem.step}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {toFriendlyStepMessage(stepItem)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!explanation?.length && canExplain && onExplain && (
            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs text-sky-900">
              <p className="font-semibold uppercase tracking-wide">Explanation on demand</p>
              <p className="mt-1 text-sky-800">
                LIME was skipped for speed. Click Explain to generate token-level highlights.
              </p>
              <button
                type="button"
                onClick={onExplain}
                disabled={isExplaining}
                className="mt-3 inline-flex h-8 items-center rounded-full bg-sky-700 px-4 text-[11px] font-semibold text-white hover:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExplaining ? "Explaining..." : "Explain"}
              </button>
            </div>
          )}

          {renderHighlightedText()}
        </div>

        <p className="mt-4 text-[11px] text-gray-500 shrink-0">
          Results powered by Hybrid Deep Learning Analysis.
        </p>
      </div>
    </section>
  );
}
