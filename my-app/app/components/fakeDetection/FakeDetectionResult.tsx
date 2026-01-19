type CredibilityLevel = "high" | "mixed" | "low";

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
  explanation?: [string, number][]; // Tuple of [word, weight]
  analyzedText?: string; // The original text that was analyzed
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
  explanation,
  analyzedText,
}: FakeDetectionResultProps) {
  // Helper to render text with inline highlights
  const renderHighlightedText = () => {
    if (!analyzedText || !explanation || explanation.length === 0) {
      return null;
    }

    // Create a map for quick lookup: word (lowercase) -> weight
    const weightMap = new Map(
      explanation.map(([word, weight]) => [word.toLowerCase(), weight])
    );

    // Split text into words while preserving whitespace
    const tokens = analyzedText.split(/(\s+)/);

    return (
      <div className="text-sm leading-relaxed">
        {tokens.map((token, idx) => {
          const cleanWord = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          const weight = weightMap.get(cleanWord);

          if (weight !== undefined) {
            // Word has a LIME weight - highlight it
            const isPositive = weight > 0;
            let bgColor = "";
            let textColor = "";

            if (level === "low") {
              // Fake prediction: positive = contributes to fake (bad), negative = opposes it (good)
              bgColor = isPositive ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)";
              textColor = isPositive ? "#991b1b" : "#166534";
            } else if (level === "high") {
              // Real prediction: positive = contributes to real (good), negative = opposes it (bad)
              bgColor = isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)";
              textColor = isPositive ? "#166534" : "#991b1b";
            } else {
              bgColor = "rgba(156, 163, 175, 0.3)";
              textColor = "#374151";
            }

            return (
              <span
                key={idx}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  padding: "1px 2px",
                  borderRadius: "2px",
                  fontWeight: 500,
                }}
                title={`Weight: ${weight.toFixed(4)}`}
              >
                {token}
              </span>
            );
          }

          // Regular word or whitespace
          return <span key={idx}>{token}</span>;
        })}
      </div>
    );
  };

  const highlightedText = renderHighlightedText();

  return (
    <section className="flex flex-col rounded-3xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg px-6 sm:px-8 py-6 sm:py-7 h-[550px]">
      <div
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0`}
      >
        Predicted: {label}
      </div>

      <div className="mt-6 flex-1 min-h-0 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 overflow-y-auto">
        {highlightedText ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-2">
              Text Analysis
            </h4>
            {highlightedText}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="whitespace-pre-wrap text-xs text-gray-500">{details}</div>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{details}</div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-gray-500 shrink-0">
        <span className="inline-block w-3 h-3 rounded mr-1" style={{ backgroundColor: level === "low" ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)" }}></span>
        Supports prediction
        <span className="inline-block w-3 h-3 rounded mx-1 ml-3" style={{ backgroundColor: level === "low" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)" }}></span>
        Opposes prediction
      </p>
    </section>
  );
}
