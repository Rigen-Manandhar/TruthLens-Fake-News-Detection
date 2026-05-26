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
    return "border-sky-200/80 bg-sky-50 text-(--news-risk-text) dark:border-sky-400/30 dark:bg-sky-500/10";
  }

  if (analysis.status === "error") {
    return "border-(--line) bg-(--surface-pill) text-(--foreground-strong)";
  }

  const verdict = (analysis.verdict || "").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "border-emerald-200 bg-emerald-50 text-(--news-risk-text) dark:border-emerald-400/30 dark:bg-emerald-500/10";
  }

  if (verdict === "SUSPICIOUS") {
    return "border-red-200 bg-red-50 text-(--news-risk-text) dark:border-red-400/30 dark:bg-red-500/10";
  }

  return "border-amber-200 bg-amber-50 text-(--news-risk-text) dark:border-amber-400/30 dark:bg-amber-500/10";
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
    return "Unable to fetch article";
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
    return "from-sky-300/60 via-sky-200/30 to-transparent dark:from-sky-400/45 dark:via-sky-400/15 dark:to-transparent";
  }

  if (analysis.status === "error") {
    return "from-(--line) via-(--line) to-transparent";
  }

  const verdict = (analysis.verdict || "").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "from-emerald-400/60 via-emerald-200/30 to-transparent dark:from-emerald-400/45 dark:via-emerald-400/15 dark:to-transparent";
  }
  if (verdict === "SUSPICIOUS") {
    return "from-red-400/60 via-red-200/30 to-transparent dark:from-red-400/45 dark:via-red-400/15 dark:to-transparent";
  }
  return "from-amber-400/60 via-amber-200/30 to-transparent dark:from-amber-400/45 dark:via-amber-400/15 dark:to-transparent";
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
