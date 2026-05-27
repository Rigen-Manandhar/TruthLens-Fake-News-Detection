import type {
  ExplanationSummary,
  UncertaintyInfo,
} from "@/lib/shared/detection-feedback";
import ResultExplanation, { hasExplanationContent } from "./ResultExplanation";
import type { CredibilityLevel } from "./resultMapping";

interface ResultStatusPanelProps {
  level: CredibilityLevel;
  details: string;
  explanation?: [string, number][];
  analyzedText?: string;
  explanationClass?: string;
  uncertainty?: UncertaintyInfo;
  explanationSummary?: ExplanationSummary;
  limeModel?: "A" | "B" | null;
  uncertaintyReason: string | null;
  canExplain?: boolean;
  isExplaining?: boolean;
  onExplain?: () => void;
}

export default function ResultStatusPanel({
  level,
  details,
  explanation,
  analyzedText,
  explanationClass,
  uncertainty,
  explanationSummary,
  limeModel,
  uncertaintyReason,
  canExplain = false,
  isExplaining = false,
  onExplain,
}: ResultStatusPanelProps) {
  const hasUncertainty = Boolean(uncertaintyReason);
  const hasDetails = Boolean(details && !uncertainty?.reason_message);
  const showLanguageSignalsCta = Boolean(!explanation?.length && canExplain && onExplain);
  const hasAnyExplanation = hasExplanationContent({
    explanation,
    analyzedText,
    explanationSummary,
  });

  if (!hasUncertainty && !hasDetails && !showLanguageSignalsCta && !hasAnyExplanation) {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-dashed border-(--line) bg-(--surface-deep) px-4 py-4 text-sm text-(--muted-foreground) wrap-break-word max-h-[60vh] overflow-y-auto overscroll-contain sm:max-h-128 lg:flex-1 lg:min-h-0 lg:max-h-144">
      {uncertaintyReason && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold uppercase tracking-wide">
            Reason: {uncertaintyReason}
          </p>
          {uncertainty?.reason_message && (
            <p className="mt-1 wrap-break-word text-amber-800 dark:text-amber-300">
              {uncertainty.reason_message}
            </p>
          )}
        </div>
      )}

      {details && !uncertainty?.reason_message && (
        <div className="mb-4 whitespace-pre-wrap wrap-break-word text-xs text-(--muted-foreground)">
          {details}
        </div>
      )}

      {!explanation?.length && canExplain && onExplain && (
        <div className="mb-4 rounded-xl border border-(--line) bg-(--accent-soft) px-3 py-3 text-xs text-(--accent-strong)">
          <p className="font-semibold uppercase tracking-wide">Language signals on demand</p>
          <p className="mt-1 text-(--accent-strong)">
            See which words pushed the result toward FAKE or REAL. Click Language signals to run a detailed analysis.
          </p>
          <button
            type="button"
            onClick={onExplain}
            disabled={isExplaining}
            className="mt-3 inline-flex h-8 items-center rounded-full bg-(--ink) px-4 text-[11px] font-semibold text-(--ink-foreground) hover:bg-(--accent) disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExplaining ? "Explaining..." : "Language signals"}
          </button>
        </div>
      )}

      <ResultExplanation
        level={level}
        explanation={explanation}
        analyzedText={analyzedText}
        explanationClass={explanationClass}
        explanationSummary={explanationSummary}
        limeModel={limeModel}
        isExplaining={isExplaining}
        onExplain={onExplain}
      />
    </div>
  );
}
