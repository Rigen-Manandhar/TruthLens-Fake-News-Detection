import type {
  ConflictInfo,
  EvidenceSummary,
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
  evidenceSummary?: EvidenceSummary;
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
  UNSUPPORTED_URL: "Unsupported URL",
};


export default function FakeDetectionResult({
  level,
  label,
  details,
  riskLevel,
  explanation,
  analyzedText,
  explanationClass,
  uncertainty,
  modelOutputs,
  conflict,
  fetchMetadata,
  evidenceSummary,
  limeModel,
  canExplain = false,
  isExplaining = false,
  onExplain,
}: FakeDetectionResultProps) {
  const hasResult = label !== "Paste text or a URL to assess misinformation risk";
  const uncertaintyReason = uncertainty?.reason_code
    ? reasonLabelMap[uncertainty.reason_code] ?? uncertainty.reason_code
    : null;
  const sourceSignal = evidenceSummary?.source_signal;
  const coverageSignal = evidenceSummary?.coverage_signal;
  const headlineRan = modelOutputs?.model_a?.ran;
  const articleRan = modelOutputs?.model_b?.ran;
  const bothRan = headlineRan && articleRan;

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
            Language Signal Analysis (LIME{limeModel ? ` - Model ${limeModel}` : ""})
          </h4>
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={isExplaining}
              className="inline-flex h-7 items-center rounded-full border border-(--line) bg-[#fffdf8] px-3 text-[11px] font-semibold text-[#5f5548] hover:bg-[#f4eee2] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExplaining ? "Explaining..." : "Explain"}
            </button>
          )}
        </div>
        <div className="wrap-break-word rounded-xl border border-dotted border-(--line) bg-[#f7f1e6] p-3">
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
    <section className="relative flex h-full flex-col rounded-3xl border border-(--line) bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#e8b074] via-(--accent) to-[#12100d]" />

      <div className="relative flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
          >
            {hasResult ? `Result: ${label}` : label}
          </div>
          {riskLevel && (
            <span className="inline-flex items-center rounded-full border border-(--line) bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#5f5548]">
              Risk: {riskLevel}
            </span>
          )}
          <span className="text-xs text-[#8a7d6d]">Hybrid evidence and risk analysis</span>
        </div>

        {hasResult && (
          <p className="mt-4 text-sm text-[#4f473c] leading-relaxed font-medium">
            {level === "high" &&
              "The available signals show lower misinformation risk, but this is not a guarantee that every claim is true."}
            {level === "low" &&
              "The available signals show higher misinformation risk. Review the source and evidence before trusting or sharing."}
            {level === "mixed" &&
              "The system does not have enough reliable evidence to make a strong risk judgment."}
          </p>
        )}

        {hasResult && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            <p className="font-semibold uppercase tracking-wide">What this result means</p>
            <p className="mt-1">
              TruthLens supports review. It does not replace human fact-checking or prove truth.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-dashed border-(--line) bg-[#f7f1e6] px-4 py-4 text-sm text-[#5f5548] wrap-break-word max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-128 lg:flex-1 lg:min-h-0 lg:max-h-144">
          {uncertaintyReason && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wide">
                Reason: {uncertaintyReason}
              </p>
              {uncertainty?.reason_message && (
                <p className="mt-1 wrap-break-word text-amber-800">{uncertainty.reason_message}</p>
              )}
            </div>
          )}

          {details && !uncertainty?.reason_message && (
            <div className="mb-4 whitespace-pre-wrap wrap-break-word text-xs text-[#5f5548]">{details}</div>
          )}

          {(sourceSignal || fetchMetadata?.attempted || headlineRan || articleRan) && (
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-[#3f382f] text-xs uppercase tracking-wide">
                What we checked
              </h4>
              <div className="grid gap-3">
                {sourceSignal && (
                  <div className="rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
                    <div className="text-xs font-semibold text-[#4c4439]">Source credibility</div>
                    <p className="text-xs text-[#5f5548] mt-2">
                      {sourceSignal.known
                        ? `${sourceSignal.domain} — ${sourceSignal.credibility ?? "credibility noted"}. ${sourceSignal.rationale ?? ""}`
                        : `${sourceSignal.domain ?? "No URL"} is not in our source database, so no source-based signal was applied.`}
                    </p>
                  </div>
                )}

                {fetchMetadata?.attempted && (
                  <div className="rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
                    <div className="text-xs font-semibold text-[#4c4439]">Article retrieval</div>
                    <p className="text-xs text-[#5f5548] mt-2">
                      {fetchMetadata.success
                        ? "The article text was successfully retrieved from the URL."
                        : "Article retrieval was attempted but unsuccessful."}
                    </p>
                  </div>
                )}

                {(headlineRan || articleRan) && (
                  <div className="rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
                    <div className="text-xs font-semibold text-[#4c4439]">Language analysis</div>
                    <p className="text-xs text-[#5f5548] mt-2">
                      {bothRan
                        ? "Both the headline and the article body were analyzed for language patterns."
                        : headlineRan
                          ? "The headline was analyzed for language patterns."
                          : "The article body was analyzed for language patterns."}
                      {" "}Language signals are indicators, not proof of truth or falsehood.
                      {conflict?.is_conflict ? " The signals were inconclusive, so this result is treated as review-needed." : ""}
                    </p>
                  </div>
                )}

                {coverageSignal?.checked && (
                  <div className="rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
                    <div className="text-xs font-semibold text-[#4c4439]">Claim cross-reference</div>
                    <p className="text-xs text-[#5f5548] mt-2">
                      {coverageSignal.message}
                    </p>
                    {evidenceSummary?.claim_hints?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#5f5548]">
                        {evidenceSummary.claim_hints.map((claim) => (
                          <li key={claim}>{claim}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {!explanation?.length && canExplain && onExplain && (
            <div className="mb-4 rounded-xl border border-(--line) bg-(--accent-soft) px-3 py-3 text-xs text-[#0b4f43]">
              <p className="font-semibold uppercase tracking-wide">Explanation on demand</p>
              <p className="mt-1 text-[#0a5f50]">
                LIME was skipped for speed. Click Explain to generate token-level language-signal highlights.
              </p>
              <button
                type="button"
                onClick={onExplain}
                disabled={isExplaining}
                className="mt-3 inline-flex h-8 items-center rounded-full bg-[#12100d] px-4 text-[11px] font-semibold text-[#f7f1e6] hover:bg-(--accent) disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExplaining ? "Explaining..." : "Explain"}
              </button>
            </div>
          )}

          {renderHighlightedText()}
        </div>

        <p className="mt-4 text-[11px] text-[#7f7364] shrink-0">
          Results powered by Hybrid Evidence and Risk Analysis.
        </p>
      </div>
    </section>
  );
}
