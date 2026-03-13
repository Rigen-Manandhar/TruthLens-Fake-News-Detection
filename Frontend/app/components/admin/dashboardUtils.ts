import type { AdminRecentFeedback } from "@/lib/shared/admin";

export const formatDateTime = (value: string | null) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

export const formatPercent = (value: number | null) => {
  if (value === null) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
};

export const getVerdictBadge = (feedback: AdminRecentFeedback) => {
  const verdict = feedback.verdict.toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (verdict === "SUSPICIOUS") {
    return "border-red-200 bg-red-50 text-red-900";
  }
  return "border-amber-200 bg-amber-50 text-amber-900";
};
