import type { ExplanationSummary } from "@/lib/shared/detection-feedback";
import type { CredibilityLevel } from "./resultMapping";

interface ResultExplanationProps {
  level: CredibilityLevel;
  explanation?: [string, number][];
  analyzedText?: string;
  explanationClass?: string;
  explanationSummary?: ExplanationSummary;
  limeModel?: "A" | "B" | null;
  isExplaining?: boolean;
  onExplain?: () => void;
}

export function hasExplanationContent({
  explanation,
  analyzedText,
  explanationSummary,
}: Pick<ResultExplanationProps, "explanation" | "analyzedText" | "explanationSummary">) {
  return Boolean(
    (explanationSummary &&
      (explanationSummary.top_fake_words.length > 0 ||
        explanationSummary.top_real_words.length > 0)) ||
      (analyzedText && explanation && explanation.length > 0)
  );
}

export default function ResultExplanation({
  level,
  explanation,
  analyzedText,
  explanationClass,
  explanationSummary,
  limeModel,
  isExplaining = false,
  onExplain,
}: ResultExplanationProps) {
  const summary = renderExplanationSummary({
    explanationSummary,
    isExplaining,
    onExplain,
  });
  const highlightedText = renderHighlightedText({
    level,
    explanation,
    analyzedText,
    explanationClass,
    limeModel,
  });

  if (!summary && !highlightedText) {
    return null;
  }

  return (
    <>
      {summary}
      {highlightedText}
    </>
  );
}

function renderExplanationSummary({
  explanationSummary,
  isExplaining,
  onExplain,
}: Pick<ResultExplanationProps, "explanationSummary" | "isExplaining" | "onExplain">) {
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
        <h4 className="font-semibold text-(--foreground-strong) text-xs uppercase tracking-wide font-sans">
          Language Signal Analysis
          {modelName ? ` - Model ${explanationSummary.model_used} (${modelName})` : ""}
        </h4>
        {onExplain && (
          <button
            type="button"
            onClick={onExplain}
            disabled={isExplaining}
            className="inline-flex h-7 items-center rounded-full border border-(--line) bg-(--surface-strong) px-3 text-[11px] font-semibold text-(--muted-foreground) hover:bg-(--surface-hover) disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExplaining ? "Explaining..." : "Re-explain"}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {explanationSummary.top_fake_words.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 dark:border-red-400/30 dark:bg-red-500/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800 dark:text-red-300">
              Fake indicators
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {explanationSummary.top_fake_words.map((w) => (
                <span
                  key={w.word}
                  className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-900 dark:bg-red-500/20 dark:text-red-200"
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
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-400/30 dark:bg-emerald-500/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              Real indicators
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {explanationSummary.top_real_words.map((w) => (
                <span
                  key={w.word}
                  className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200"
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
}

function renderHighlightedText({
  level,
  explanation,
  analyzedText,
  explanationClass,
  limeModel,
}: Pick<
  ResultExplanationProps,
  "level" | "explanation" | "analyzedText" | "explanationClass" | "limeModel"
>) {
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
        <h4 className="font-semibold text-(--foreground-strong) text-xs uppercase tracking-wide font-sans">
          Language Signal Analysis (LIME{limeModel ? ` - Model ${limeModel}` : ""})
        </h4>
      </div>
      <div className="wrap-break-word rounded-xl border border-dotted border-(--line) bg-(--surface-deep) p-3">
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
          } else if (isPositive) {
            bgColor = "rgba(34, 197, 94, 0.2)";
            textColor = "#166534";
          } else {
            bgColor = "rgba(239, 68, 68, 0.2)";
            textColor = "#991b1b";
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
}
