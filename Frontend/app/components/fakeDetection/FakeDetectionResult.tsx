type CredibilityLevel = "high" | "mixed" | "low";

interface Step {
  step: string;
  score_impact: number;
  details: string;
  sentence_preview?: string;
}

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
  steps?: Step[];
  explanation?: [string, number][];
  analyzedText?: string;
  explanationClass?: string;
}

const levelStyles: Record<CredibilityLevel, string> = {
  high: "bg-emerald-50 text-emerald-800 border-emerald-100",
  mixed: "bg-amber-50 text-amber-800 border-amber-100",
  low: "bg-red-50 text-red-800 border-red-100",
};

export default function FakeDetectionResult({
  level,
  label,
  details,
  steps,
  explanation,
  analyzedText,
  explanationClass,
}: FakeDetectionResultProps) {

  const hasResult = label !== "Input Text or URL to detect if the news is Fake or Real";

  // Helper to render text with inline highlights for LIME
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

    // Create a map for quick lookup: word (lowercase) -> weight
    const weightMap = new Map(
      explanation.map(([word, weight]) => [word.toLowerCase(), weight])
    );

    // Split text into words while preserving whitespace
    const tokens = analyzedText.split(/(\s+)/);

    return (
      <div className="text-sm leading-relaxed mb-6 font-serif">
        <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-2 font-sans">
          Deep Learning Analysis (LIME)
        </h4>
        <div className="p-3 bg-gray-50/50 rounded-xl border border-dotted border-gray-300">
          {tokens.map((token, idx) => {
            const cleanWord = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const weight = weightMap.get(cleanWord);

            if (weight !== undefined) {
              // Word has a LIME weight - highlight it
              const isPositive = weight >= 0;

              let bgColor = "transparent";
              let textColor = "inherit";

              if (colorMode === "fake") {
                if (isPositive) { bgColor = "rgba(239, 68, 68, 0.2)"; textColor = "#991b1b"; }
                else { bgColor = "rgba(34, 197, 94, 0.2)"; textColor = "#166534"; }
              } else if (colorMode === "real") {
                if (isPositive) { bgColor = "rgba(34, 197, 94, 0.2)"; textColor = "#166534"; }
                else { bgColor = "rgba(239, 68, 68, 0.2)"; textColor = "#991b1b"; }
              } else {
                if (isPositive) { bgColor = "rgba(34, 197, 94, 0.2)"; textColor = "#166534"; }
                else { bgColor = "rgba(239, 68, 68, 0.2)"; textColor = "#991b1b"; }
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
            }
            return <span key={idx}>{token}</span>;
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
          <span className="text-xs text-gray-400">
            Hybrid credibility analysis
          </span>
        </div>

        {hasResult && (
          <p className="mt-4 text-sm text-gray-700 leading-relaxed font-medium">
            {level === "high" &&
              "The hybrid model analysis indicates this content is likely credible and authentic."}
            {level === "low" &&
              "The analysis detected strong indicators commonly associated with misleading or fabricated content."}
            {level === "mixed" &&
              "The model detected mixed signals and could not definitively verify credibility. Proceed with caution."}
          </p>
        )}

        <div className="mt-6 flex-1 min-h-0 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 overflow-y-auto">
          {details && <div className="whitespace-pre-wrap mb-4">{details}</div>}

          {steps && steps.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide">
                Signal breakdown
              </h4>
              {steps.map((stepItem, index) => (
                <div
                  key={`${stepItem.step}-${index}`}
                  className="rounded-xl border border-gray-200 bg-white/80 px-3 py-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>{stepItem.step}</span>
                    <span className="text-gray-500">Score {stepItem.score_impact}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {stepItem.details}
                  </p>
                  {stepItem.sentence_preview && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      “{stepItem.sentence_preview}”
                    </p>
                  )}
                </div>
              ))}
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
