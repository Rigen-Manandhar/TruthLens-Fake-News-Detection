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
import ResultStatusPanel from "./ResultStatusPanel";
import SignalsChecklist from "./SignalsChecklist";
import { INITIAL_RESULT_LABEL, type CredibilityLevel } from "./resultMapping";
import { ScanSearch } from "../ui/icons";

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
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
  onExplain?: () => void;
}

const levelStyles: Record<CredibilityLevel, string> = {
  high: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/30",
  mixed:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30",
  low: "bg-red-50 text-red-900 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30",
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
  onExplain,
}: FakeDetectionResultProps) {
  const hasResult = label !== INITIAL_RESULT_LABEL;
  const uncertaintyReason = uncertainty?.reason_code
    ? (reasonLabelMap[uncertainty.reason_code] ?? uncertainty.reason_code)
    : null;

  return (
    <section
      aria-busy={isLoading || undefined}
      className="relative flex h-full flex-col rounded-3xl border border-(--line) bg-(--surface)/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--warm) via-(--accent) to-(--ink)" />

      <div className="relative flex flex-col h-full">
        {hasResult ? (
          <ResultHeader level={level} label={label} />
        ) : isLoading ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-(--line) bg-(--surface-deep) px-3 py-1 text-xs font-semibold text-(--muted-foreground-strong)">
              Analyzing...
            </span>
          </div>
        ) : (
          <EmptyState />
        )}

        <div className="mt-5 space-y-3">
          <RiskMeter
            level={level}
            riskLabel={
              hasResult ? label : isLoading ? "Analyzing..." : "Awaiting input"
            }
            finalScore={finalScore}
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
          {isLoading && !hasResult && <SignalsSkeleton />}
        </div>

        {hasResult && (
          <ResultStatusPanel
            level={level}
            details={details}
            explanation={explanation}
            analyzedText={analyzedText}
            explanationClass={explanationClass}
            uncertainty={uncertainty}
            explanationSummary={explanationSummary}
            limeModel={limeModel}
            uncertaintyReason={uncertaintyReason}
            canExplain={canExplain}
            isExplaining={isExplaining}
            onExplain={onExplain}
          />
        )}

        <p className="mt-4 text-[11px] text-(--muted-foreground) shrink-0">
          Results powered by Hybrid Evidence and Risk Analysis.
        </p>
      </div>
    </section>
  );
}

function ResultHeader({
  level,
  label,
}: {
  level: CredibilityLevel;
  label: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
        >
          {label}
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground leading-relaxed font-medium">
        {level === "high" &&
          "The available signals show lower misinformation risk, but this is not a guarantee that every claim is true."}
        {level === "low" &&
          "The available signals show higher misinformation risk. Review the source and evidence before trusting or sharing."}
        {level === "mixed" &&
          "The system does not have enough reliable evidence to make a strong risk judgment."}
      </p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-semibold uppercase tracking-wide">
          What this result means
        </p>
        <p className="mt-1">
          TruthLens supports review. It does not replace human fact-checking or
          prove truth.
        </p>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-3">
      <ScanSearch
        aria-hidden
        className="h-8 w-8 text-(--muted-foreground)/60"
      />
      <p className="text-sm font-semibold text-(--foreground-strong)">
        Awaiting input
      </p>
      <p className="text-xs text-(--muted-foreground)">
        Paste an article or URL on the left to begin.
      </p>
    </div>
  );
}

function SignalsSkeleton() {
  return (
    <div className="rounded-2xl border border-(--line) bg-(--surface-strong) px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
        Signals checked
      </p>
      <ul className="mt-3 space-y-2.5">
        {[0, 1, 2].map((idx) => (
          <li key={idx} className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 rounded-full bg-(--surface-pill)"
            />
            <span
              aria-hidden
              className="h-3 flex-1 rounded-full bg-(--surface-pill)"
            />
            <span
              aria-hidden
              className="h-3 w-12 rounded-full bg-(--surface-pill)"
            />
          </li>
        ))}
      </ul>
      <span className="sr-only">Analyzing in progress</span>
    </div>
  );
}
