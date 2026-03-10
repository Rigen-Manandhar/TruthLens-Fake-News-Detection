"use client";

import { useEffect, useMemo, useState } from "react";
import Footer from "../Footer";
import type {
  AdminDashboardResponse,
  AdminExportJob,
  AdminRecentFeedback,
  AdminRecentUser,
} from "@/lib/shared/admin";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
};

const formatPercent = (value: number | null) => {
  if (value === null) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
};

const getVerdictBadge = (feedback: AdminRecentFeedback) => {
  const verdict = feedback.verdict.toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (verdict === "SUSPICIOUS") {
    return "border-red-200 bg-red-50 text-red-900";
  }
  return "border-amber-200 bg-amber-50 text-amber-900";
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [exportJob, setExportJob] = useState<AdminExportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as
          | (AdminDashboardResponse & { error?: string })
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load admin dashboard.");
        }

        if (!mounted) {
          return;
        }

        setDashboard(data as AdminDashboardResponse);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load admin dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!exportJob || exportJob.status !== "processing") {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/admin/export/${exportJob.jobId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as AdminExportJob;
      setExportJob(data);
    }, 3000);

    return () => clearInterval(interval);
  }, [exportJob]);

  const metricCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        label: "Registered users",
        value: dashboard.metrics.totalUsers,
        tone: "bg-[#fffdfa]/88",
      },
      {
        label: "Feedback submissions",
        value: dashboard.metrics.totalFeedback,
        tone: "bg-[#f7f1e6]/92",
      },
      {
        label: "Marked correct",
        value: dashboard.metrics.correctFeedback,
        tone: "bg-emerald-50",
      },
      {
        label: "Marked wrong",
        value: dashboard.metrics.wrongFeedback,
        tone: "bg-red-50",
      },
    ];
  }, [dashboard]);

  const requestExport = async () => {
    setExporting(true);

    try {
      const response = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => null)) as
        | { jobId?: string; status?: string; error?: string }
        | null;

      if (!response.ok || !data?.jobId) {
        throw new Error(data?.error ?? "Failed to request export.");
      }

      const statusResponse = await fetch(`/api/admin/export/${data.jobId}`, {
        cache: "no-store",
      });
      if (!statusResponse.ok) {
        throw new Error("Failed to load export status.");
      }

      const statusData = (await statusResponse.json()) as AdminExportJob;
      setExportJob(statusData);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Failed to request export."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[9rem] right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main space-y-10 sm:space-y-12">
        <section className="section-reveal rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-end">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#867a6a]">
                Admin Dashboard
              </p>
              <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-[#17130f] sm:text-[3.2rem]">
                Review user activity, feedback quality, and export admin data.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
                This dashboard surfaces account growth, fake-news feedback, and
                recent platform activity in one place. Use it to review what
                users are submitting and export a full JSON snapshot when
                needed.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,253,248,0.96),rgba(247,241,230,0.92))] p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5548]">
                  Admin actions
                </div>
                <p className="text-sm leading-7 text-[#4f473c]">
                  Export one JSON file with all admin-visible users and
                  detection feedback data.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={requestExport}
                    disabled={exporting}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#12100d] px-6 text-sm font-semibold text-[#f7f1e6] shadow-[0_12px_24px_rgba(24,16,8,0.2)] transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {exporting ? "Preparing export..." : "Export all admin data"}
                  </button>
                  {exportJob?.downloadUrl && (
                    <a
                      href={exportJob.downloadUrl}
                      className="text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
                    >
                      Download JSON export
                    </a>
                  )}
                  {exportJob && (
                    <p className="text-xs text-[#7f7364]">
                      Status: {exportJob.status}
                      {exportJob.expiresAt
                        ? ` · Expires ${formatDateTime(exportJob.expiresAt)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </section>
        )}

        {loading && (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`metric-skeleton-${index}`}
                className="rounded-[1.75rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)]"
              >
                <div className="h-4 w-28 rounded-full bg-[#e6dccb] animate-pulse" />
                <div className="mt-4 h-10 w-24 rounded-2xl bg-[#e6dccb] animate-pulse" />
              </div>
            ))}
          </section>
        )}

        {dashboard && (
          <>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => (
                <article
                  key={card.label}
                  className={`section-reveal rounded-[1.75rem] border border-[var(--line)] ${card.tone} p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)]`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                    {card.label}
                  </p>
                  <p className="mt-4 page-title display-title text-4xl font-bold text-[#17130f]">
                    {card.value}
                  </p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
              <article className="section-reveal rounded-[2rem] border border-[var(--line)] bg-[#f7f1e6]/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                  Feedback summary
                </p>
                <h2 className="mt-3 page-title display-title text-3xl font-bold text-[#17130f]">
                  Accuracy sentiment and source mix.
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
                      Correct rate
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#17130f]">
                      {formatPercent(dashboard.feedbackBreakdown.correctRate)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
                      Web feedback
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#17130f]">
                      {dashboard.activitySummary.feedbackSources.web}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
                      Extension feedback
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-[#17130f]">
                      {dashboard.activitySummary.feedbackSources.extension}
                    </p>
                  </div>
                </div>
              </article>

              <article className="section-reveal delay-1 rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                  Activity summary
                </p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-sm font-semibold text-[#17130f]">
                      Latest signup
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {formatDateTime(dashboard.activitySummary.latestSignupAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-sm font-semibold text-[#17130f]">
                      Latest feedback
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {formatDateTime(dashboard.activitySummary.latestFeedbackAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                    <p className="text-sm font-semibold text-[#17130f]">
                      Other feedback sources
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {dashboard.activitySummary.feedbackSources.other}
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="section-reveal delay-1 rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                    Recent feedback
                  </p>
                  <h2 className="mt-2 page-title display-title text-3xl font-bold text-[#17130f]">
                    Latest fake-news result feedback.
                  </h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Newest submissions first.
                </p>
              </div>

              {dashboard.recentFeedback.length === 0 ? (
                <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                  No feedback has been submitted yet.
                </p>
              ) : (
                <div className="mt-6 grid gap-4">
                  {dashboard.recentFeedback.map((feedback) => (
                    <article
                      key={feedback.id}
                      className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-5"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#17130f]">
                              {feedback.userName}
                            </span>
                            <span className="text-xs text-[#7f7364]">
                              {feedback.userEmail}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 font-semibold ${getVerdictBadge(
                                feedback
                              )}`}
                            >
                              {feedback.verdict}
                            </span>
                            <span className="inline-flex rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 font-semibold text-[#5f5548]">
                              {feedback.isCorrect ? "Marked correct" : "Marked wrong"}
                            </span>
                            <span className="inline-flex rounded-full border border-[var(--line)] bg-[#fffdfa] px-3 py-1 font-semibold text-[#5f5548]">
                              {feedback.source}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-[#7f7364]">
                          {formatDateTime(feedback.createdAt)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
                        <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[#f7f1e6] px-4 py-3 text-sm leading-6 text-[#4f473c]">
                          {feedback.comment || "No comment was provided for this feedback entry."}
                        </div>
                        <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fffdfa] px-4 py-3 text-sm text-[#5f5548]">
                          <p>
                            <span className="font-semibold text-[#17130f]">Risk:</span>{" "}
                            {feedback.riskLevel}
                          </p>
                          <p className="mt-2">
                            <span className="font-semibold text-[#17130f]">Input mode:</span>{" "}
                            {feedback.inputMode}
                          </p>
                          <p className="mt-2 break-all">
                            <span className="font-semibold text-[#17130f]">URL:</span>{" "}
                            {feedback.url || "N/A"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="section-reveal delay-2 rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                    Recent users
                  </p>
                  <h2 className="mt-2 page-title display-title text-3xl font-bold text-[#17130f]">
                    Latest account signups.
                  </h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Newest accounts first.
                </p>
              </div>

              {dashboard.recentUsers.length === 0 ? (
                <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                  No users have signed up yet.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {dashboard.recentUsers.map((user: AdminRecentUser) => (
                    <article
                      key={user.id}
                      className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-[#17130f]">
                            {user.name}
                          </p>
                          <p className="mt-1 break-all text-sm text-[#5f5548]">
                            {user.email}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5548]">
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                        <p>Created: {formatDateTime(user.createdAt)}</p>
                        <p>Updated: {formatDateTime(user.updatedAt)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
