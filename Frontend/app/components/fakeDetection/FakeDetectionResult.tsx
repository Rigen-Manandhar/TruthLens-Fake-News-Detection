import type {
  ConflictInfo,
  EvidenceSummary,
  ExplanationSummary,
  FetchMetadata,
  ModelOutputs,
  ParseMetadata,
  Step,
  UncertaintyInfo,
} from "@/lib/shared/detection-feedback";
import RiskMeter from "./RiskMeter";
import SignalsChecklist from "./SignalsChecklist";
import { ScanSearch } from "../ui/icons";

type CredibilityLevel = "high" | "mixed" | "low";

export type DetectionExample = {
  key: string;
  label: string;
  text: string;
  url: string;
};

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
  riskLevel?: string;
  finalScore?: number;
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
  explanationSummary?: ExplanationSummary;
  limeModel?: "A" | "B" | null;
  canExplain?: boolean;
  isExplaining?: boolean;
  isLoading?: boolean;
  examples?: DetectionExample[];
  onPrefill?: (example: DetectionExample) => void;
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

const INITIAL_LABEL = "Paste text or a URL to assess misinformation risk";

export default function FakeDetectionResult({
  level,
  label,
  details,
  riskLevel,
  finalScore,
  explanation,
  analyzedText,
  explanationClass,
  uncertainty,
  modelOutputs,
  conflict,
  fetchMetadata,
  evidenceSummary,
  explanationSummary,
  limeModel,
  canExplain = false,
  isExplaining = false,
  isLoading = false,
  examples,
  onPrefill,
  onExplain,
}: FakeDetectionResultProps) {
  const hasResult = label !== INITIAL_LABEL;
  const uncertaintyReason = uncertainty?.reason_code
    ? reasonLabelMap[uncertainty.reason_code] ?? uncertainty.reason_code
    : null;

  const renderExplanationSummary = () => {
    if (
      !explanationSummary ||
      (!explanationSummary.top_fake_words.length &&
        !explanationSummary.top_real_words.length)
    ) {
      return null;
    }

    const modelName =
      explanationSummary.model_used === "A"
        ? "Headline"
        : explanationSummary.model_used === "B"
          ? "Article"
          : null;

    return (
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-semibold text-[#3f382f] text-xs uppercase tracking-wide font-sans">
            Language Signal Analysis
            {modelName ? ` — Model ${explanationSummary.model_used} (${modelName})` : ""}
          </h4>
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={isExplaining}
              className="inline-flex h-7 items-center rounded-full border border-(--line) bg-[#fffdf8] px-3 text-[11px] font-semibold text-[#5f5548] hover:bg-[#f4eee2] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExplaining ? "Explaining..." : "Re-explain"}
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {explanationSummary.top_fake_words.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
                Fake indicators
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {explanationSummary.top_fake_words.map((w) => (
                  <span
                    key={w.word}
                    className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-900"
                    style={{ opacity: Math.min(1, Math.abs(w.weight) * 2 + 0.3) }}
                    title={`Weight: ${w.weight.toFixed(4)} (pushes toward FAKE)`}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          )}
          {explanationSummary.top_real_words.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                Real indicators
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {explanationSummary.top_real_words.map((w) => (
                  <span
                    key={w.word}
                    className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900"
                    style={{ opacity: Math.min(1, Math.abs(w.weight) * 2 + 0.3) }}
                    title={`Weight: ${w.weight.toFixed(4)} (pushes toward REAL)`}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHighlightedText = () => {
    if (!analyzedText || !explanation || explanation.length === 0) {
      return null;
    }

    const normalizedClass = (explanationClass ?? "").toUpperCase();
    let colorMode: "fake" | "real" | "neutral" = "neutral";
    if (normalizedClass.includes("FAKE") || normalizedClass.includes("FALSE")) {
      colorMode = "fake";
    } else if (
      normalizedClass.includes("REAL") ||
      normalizedClass.includes("TRUE")
    ) {
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
    <section
      aria-busy={isLoading || undefined}
      className="relative flex h-full flex-col rounded-3xl border border-(--line) bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#e8b074] via-(--accent) to-[#12100d]" />

      <div className="relative flex flex-col h-full">
        {hasResult ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
              >
                {label}
              </div>
              {riskLevel && (
                <span className="inline-flex items-center rounded-full border border-(--line) bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#5f5548]">
                  Risk: {riskLevel}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-[#4f473c] leading-relaxed font-medium">
              {level === "high" &&
                "The available signals show lower misinformation risk, but this is not a guarantee that every claim is true."}
              {level === "low" &&
                "The available signals show higher misinformation risk. Review the source and evidence before trusting or sharing."}
              {level === "mixed" &&
                "The system does not have enough reliable evidence to make a strong risk judgment."}
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wide">What this result means</p>
              <p className="mt-1">
                TruthLens supports review. It does not replace human fact-checking or prove truth.
              </p>
            </div>
          </>
        ) : isLoading ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-(--line) bg-[#f7f1e6] px-3 py-1 text-xs font-semibold text-(--muted-foreground-strong)">
              Analyzing…
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <ScanSearch
              aria-hidden
              className="h-8 w-8 text-[#c7bba8]"
            />
            <p className="text-sm font-semibold text-[#17130f]">
              Awaiting input
            </p>
            <p className="text-xs text-(--muted-foreground)">
              Paste an article or URL on the left to begin, or jump in with one
              of these examples.
            </p>
            {examples && examples.length > 0 && onPrefill && (
              <div className="flex flex-wrap gap-2 pt-1">
                {examples.map((example) => (
                  <button
                    key={example.key}
                    type="button"
                    onClick={() => onPrefill(example)}
                    className="inline-flex items-center rounded-full border border-(--line) bg-[#fffdf8] px-3.5 py-1.5 text-xs font-semibold text-[#17130f] transition-colors hover:bg-[#f4eee2]"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <RiskMeter
            level={level}
            riskLabel={hasResult ? label : isLoading ? "Analyzing…" : "Awaiting input"}
            finalScore={finalScore}
            riskLevelText={riskLevel}
            disabled={!hasResult}
          />
          {hasResult && (
            <SignalsChecklist
              evidenceSummary={evidenceSummary}
              fetchMetadata={fetchMetadata}
              modelOutputs={modelOutputs}
              conflict={conflict}
            />
          )}
          {isLoading && !hasResult && (
            <div className="rounded-2xl border border-(--line) bg-[#fffdf8] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
                Signals checked
              </p>
              <ul className="mt-3 space-y-2.5">
                {[0, 1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full bg-[#e6dccb]"
                    />
                    <span
                      aria-hidden
                      className="h-3 flex-1 rounded-full bg-[#e6dccb]"
                    />
                    <span
                      aria-hidden
                      className="h-3 w-12 rounded-full bg-[#e6dccb]"
                    />
                  </li>
                ))}
              </ul>
              <span className="sr-only">Analyzing in progress</span>
            </div>
          )}
        </div>

        {hasResult && (
          <div className="mt-5 rounded-2xl border border-dashed border-(--line) bg-[#f7f1e6] px-4 py-4 text-sm text-[#5f5548] wrap-break-word max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-128 lg:flex-1 lg:min-h-0 lg:max-h-144">
            {uncertaintyReason && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                <p className="font-semibold uppercase tracking-wide">
                  Reason: {uncertaintyReason}
                </p>
                {uncertainty?.reason_message && (
                  <p className="mt-1 wrap-break-word text-amber-800">
                    {uncertainty.reason_message}
                  </p>
                )}
              </div>
            )}

            {details && !uncertainty?.reason_message && (
              <div className="mb-4 whitespace-pre-wrap wrap-break-word text-xs text-[#5f5548]">
                {details}
              </div>
            )}

            {evidenceSummary?.claim_hints?.length ? (
              <div className="mb-4 rounded-xl border border-(--line) bg-[#fffdf8] px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4c4439]">
                  Claim hints to verify manually
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[#5f5548]">
                  {evidenceSummary.claim_hints.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!explanation?.length && canExplain && onExplain && (
              <div className="mb-4 rounded-xl border border-(--line) bg-(--accent-soft) px-3 py-3 text-xs text-[#0b4f43]">
                <p className="font-semibold uppercase tracking-wide">Language signals on demand</p>
                <p className="mt-1 text-[#0a5f50]">
                  See which words pushed the result toward FAKE or REAL. Click Language signals to run a detailed analysis.
                </p>
                <button
                  type="button"
                  onClick={onExplain}
                  disabled={isExplaining}
                  className="mt-3 inline-flex h-8 items-center rounded-full bg-[#12100d] px-4 text-[11px] font-semibold text-[#f7f1e6] hover:bg-(--accent) disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExplaining ? "Explaining..." : "Language signals"}
                </button>
              </div>
            )}

            {renderExplanationSummary()}
            {renderHighlightedText()}
          </div>
        )}

        <p className="mt-4 text-[11px] text-[#7f7364] shrink-0">
          Results powered by Hybrid Evidence and Risk Analysis.
        </p>
      </div>
    </section>
  );
}
