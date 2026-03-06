import type {
  ConflictInfo,
  FetchMetadata,
  ModelOutputs,
  ParseMetadata,
  Step,
  UncertaintyInfo,
} from "@/lib/shared/detection-feedback";

type CredibilityLevel = "high" | "mixed" | "low";

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
  high: "bg-emerald-50 text-emerald-900 border-emerald-200",
  mixed: "bg-amber-50 text-amber-900 border-amber-200",
  low: "bg-red-50 text-red-900 border-red-200",
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
      <div className="mb-6 font-serif text-sm leading-relaxed">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-semibold text-[#3f382f] text-xs uppercase tracking-wide font-sans">
            Deep Learning Analysis (LIME{limeModel ? ` - Model ${limeModel}` : ""})
          </h4>
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={isExplaining}
              className="inline-flex h-7 items-center rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 text-[11px] font-semibold text-[#5f5548] hover:bg-[#f4eee2] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExplaining ? "Explaining..." : "Explain"}
            </button>
          )}
        </div>
        <div className="break-words rounded-xl border border-dotted border-[var(--line)] bg-[#f7f1e6] p-3">
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
    <section className="relative flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-[36rem]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e8b074] via-[var(--accent)] to-[#12100d]" />

      <div className="relative flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
          >
            {hasResult ? `Result: ${label}` : label}
          </div>
          {riskLevel && (
            <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#5f5548]">
              Risk: {riskLevel}
            </span>
          )}
          <span className="text-xs text-[#8a7d6d]">Hybrid credibility analysis</span>
        </div>

        {hasResult && (
          <p className="mt-4 text-sm text-[#4f473c] leading-relaxed font-medium">
            {level === "high" &&
              "The hybrid model analysis indicates this content is likely credible and authentic."}
            {level === "low" &&
              "The analysis detected strong indicators commonly associated with misleading or fabricated content."}
            {level === "mixed" &&
              "The model detected mixed signals and marked this content for review."}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[#f7f1e6] px-4 py-4 text-sm text-[#5f5548] break-words lg:flex-1 lg:min-h-0 lg:max-h-[36rem] lg:overflow-y-auto">
          {uncertaintyReason && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wide">
                Reason: {uncertaintyReason}
              </p>
              {uncertainty?.reason_message && (
                <p className="mt-1 break-words text-amber-800">{uncertainty.reason_message}</p>
              )}
            </div>
          )}

          {details && !uncertainty?.reason_message && (
            <div className="mb-4 whitespace-pre-wrap break-words text-xs text-[#5f5548]">{details}</div>
          )}

          {visibleSteps.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-[#3f382f] text-xs uppercase tracking-wide">
                What we checked
              </h4>
              {visibleSteps.map((stepItem, index) => (
                <div
                  key={`${stepItem.step}-${index}`}
                  className="rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-3"
                >
                  <div className="text-xs font-semibold text-[#4c4439]">
                    {stepItem.step}
                  </div>
                  <p className="text-xs text-[#5f5548] mt-2">
                    {toFriendlyStepMessage(stepItem)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!explanation?.length && canExplain && onExplain && (
            <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-3 text-xs text-[#0b4f43]">
              <p className="font-semibold uppercase tracking-wide">Explanation on demand</p>
              <p className="mt-1 text-[#0a5f50]">
                LIME was skipped for speed. Click Explain to generate token-level highlights.
              </p>
              <button
                type="button"
                onClick={onExplain}
                disabled={isExplaining}
                className="mt-3 inline-flex h-8 items-center rounded-full bg-[#12100d] px-4 text-[11px] font-semibold text-[#f7f1e6] hover:bg-[var(--accent)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExplaining ? "Explaining..." : "Explain"}
              </button>
            </div>
          )}

          {renderHighlightedText()}
        </div>

        <p className="mt-4 text-[11px] text-[#7f7364] shrink-0">
          Results powered by Hybrid Deep Learning Analysis.
        </p>
      </div>
    </section>
  );
}
