type CredibilityLevel = "high" | "mixed" | "low";

interface FakeDetectionResultProps {
  level: CredibilityLevel;
  label: string;
  details: string;
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
}: FakeDetectionResultProps) {
  return (
    <section className="flex h-full flex-col rounded-3xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg px-6 sm:px-8 py-6 sm:py-7">
      <div
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[level]}`}
      >
        Predicted: {label}
      </div>

      <div className="mt-6 flex-1 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600">
        {details}
      </div>

      <p className="mt-4 text-[11px] text-gray-500">
        This is just a preview and not the final result. The finished product
        will use an AI model to analyze the news article and provide a
        credibility score and explanation.
      </p>
    </section>
  );
}
