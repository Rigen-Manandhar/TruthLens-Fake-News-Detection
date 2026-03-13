import type { NewsAnalysis } from "./NewsCard";

export const formatNewsDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getAnalysisStyle = (analysis?: NewsAnalysis) => {
  if (!analysis || analysis.status === "loading") {
    return "border-sky-200/80 bg-sky-50 text-sky-900";
  }

  if (analysis.status === "error") {
    return "border-[#d6ccbd] bg-[#efe8da] text-[#6b6257]";
  }

  const verdict = (analysis.verdict || "").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (verdict === "SUSPICIOUS") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
};

export const getAnalysisText = (analysis?: NewsAnalysis) => {
  if (!analysis || analysis.status === "loading") {
    return "Analyzing...";
  }

  if (analysis.status === "error") {
    return "Analysis unavailable";
  }

  const label = analysis.verdict || "UNCERTAIN";
  const confidence =
    typeof analysis.confidence === "number"
      ? `${Math.round(analysis.confidence * 100)}%`
      : null;

  return confidence ? `${label} ${confidence}` : label;
};
