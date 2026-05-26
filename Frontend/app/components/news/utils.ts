import type { NewsAnalysis } from "./NewsCard";

export const formatNewsDate = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

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

/**
 * Just the verdict label, without any appended confidence percent.
 * Pair with getAnalysisConfidence() to render the percent separately.
 */
export const getAnalysisLabel = (analysis?: NewsAnalysis): string => {
  if (!analysis || analysis.status === "loading") {
    return "Analyzing...";
  }

  if (analysis.status === "error") {
    return "Analysis unavailable";
  }

  const verdict = (analysis.verdict || "UNCERTAIN").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "Lower Risk";
  }
  if (verdict === "SUSPICIOUS") {
    return "Higher Risk";
  }
  return "Needs Review";
};

/**
 * 0–100 confidence percent when available and the analysis has a real
 * verdict; null otherwise. Caller is responsible for rounding.
 */
export const getAnalysisConfidence = (analysis?: NewsAnalysis): number | null => {
  if (!analysis || analysis.status !== "done") {
    return null;
  }
  if (typeof analysis.confidence !== "number") {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(analysis.confidence * 100)));
};

/**
 * Tailwind classes for the verdict-tinted top accent strip on news cards.
 * Uses bg-linear-to-r from-* via-* to-* (Tailwind v4 syntax already used in
 * the codebase). Returns a neutral gradient when status is missing.
 */
export const getVerdictAccentClass = (analysis?: NewsAnalysis): string => {
  if (!analysis || analysis.status === "loading") {
    return "from-sky-300/60 via-sky-200/30 to-transparent";
  }

  if (analysis.status === "error") {
    return "from-[#d6ccbd]/60 via-[#d6ccbd]/20 to-transparent";
  }

  const verdict = (analysis.verdict || "").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "from-emerald-400/60 via-emerald-200/30 to-transparent";
  }
  if (verdict === "SUSPICIOUS") {
    return "from-red-400/60 via-red-200/30 to-transparent";
  }
  return "from-amber-400/60 via-amber-200/30 to-transparent";
};

/**
 * Backward-compatible label + confidence one-liner. Prefer
 * getAnalysisLabel + getAnalysisConfidence for new call sites.
 */
export const getAnalysisText = (analysis?: NewsAnalysis) => {
  const label = getAnalysisLabel(analysis);
  const confidence = getAnalysisConfidence(analysis);
  return confidence !== null ? `${label} ${confidence}%` : label;
};
