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
}: FakeDetectionResultProps) {

  // Helper to render text with inline highlights for LIME
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
              const isPositive = weight > 0;
              // For Fake/Real classification:
              // If model says FAKE (Low Credibility): Positive weight contributes to Fake.
              // If model says REAL (High Credibility): Positive weight contributes to Real.
              // Let's color code based on "contribution to current decision".

              // Actually, standard LIME colors: green for supported class, red for opposed.
              // But here we want simple visual cues.
              // Let's stick to Green = Real/Safe, Red = Fake/Risky.
              // If verdict is FAKE, positive weights pushed it towards Fake -> Red.
              // If verdict is REAL, positive weights pushed it towards Real -> Green.

              let bgColor = "transparent";
              let textColor = "inherit";

              if (level === 'low') { // Verdict: Fake
                if (weight > 0) { bgColor = "rgba(239, 68, 68, 0.2)"; textColor = "#991b1b"; } // Contributes to Fake -> Red
                else { bgColor = "rgba(34, 197, 94, 0.2)"; textColor = "#166534"; } // Opposes Fake -> Green
              } else if (level === 'high') { // Verdict: Real
                if (weight > 0) { bgColor = "rgba(34, 197, 94, 0.2)"; textColor = "#166534"; } // Contributes to Real -> Green
                else { bgColor = "rgba(239, 68, 68, 0.2)"; textColor = "#991b1b"; } // Opposes Real -> Red
              } else {
                // Mixed
                bgColor = "rgba(156, 163, 175, 0.2)";
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
    <section className="flex flex-col rounded-3xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg px-6 sm:px-8 py-6 sm:py-7 h-[600px]">
      <div
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]} shrink-0 w-fit`}
      >
        {label === "Input Text or URL to detect if the news is Fake or Real" ? label : `Result: ${label}`}
      </div>

      {label !== "Input Text or URL to detect if the news is Fake or Real" && (
        <p className="mt-4 text-sm text-gray-700 leading-relaxed font-medium">
          {level === "high" && "The advanced hybrid model analysis indicates this content is likely credible and authentic."}
          {level === "low" && "The advanced hybrid model analysis detected significant indicators commonly associated with fake or misleading news."}
          {level === "mixed" && "The model detected mixed signals and could not definitively verify the credibility of this content. Proceed with caution."}
        </p>
      )}

      <div className="mt-6 flex-1 min-h-0 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 overflow-y-auto">
        <div className="whitespace-pre-wrap mb-4">{details}</div>
        {renderHighlightedText()}
      </div>

      <p className="mt-4 text-[11px] text-gray-500 shrink-0">
        Results powered by Hybrid Deep Learning Analysis.
      </p>
    </section>
  );
}
