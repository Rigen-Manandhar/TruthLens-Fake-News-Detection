"use client";

import { useEffect, useMemo, useState } from "react";
import Footer from "../Footer";
import type { AdminDashboardResponse } from "@/lib/shared/admin";
import AdminFeedbackSections from "./AdminFeedbackSections";
import AdminMetricsGrid from "./AdminMetricsGrid";
import AdminRecentFeedbackSection from "./AdminRecentFeedbackSection";
import AdminRecentUsersSection from "./AdminRecentUsersSection";
import { fetchAdminDashboard } from "./dashboardApi";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAdminDashboard();
        if (mounted) {
          setDashboard(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load admin dashboard."
          );
        }
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

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-36 right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main space-y-10 sm:space-y-12">
        <section className="section-reveal rounded-4xl border border-(--line) bg-[#fffdfa]/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#867a6a]">
              Admin Dashboard
            </p>
            <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-[#17130f] sm:text-[3.2rem]">
              Review user activity and feedback quality.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-(--muted-foreground) sm:text-base">
              This dashboard surfaces account growth, fake-news feedback, and
              recent platform activity in one place so you can review how the
              system is being used.
            </p>
          </div>
        </section>

        {error && (
          <section className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </section>
        )}

        {loading && (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`metric-skeleton-${index}`}
                className="rounded-[1.75rem] border border-(--line) bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)]"
              >
                <div className="h-4 w-28 rounded-full bg-[#e6dccb] animate-pulse" />
                <div className="mt-4 h-10 w-24 rounded-2xl bg-[#e6dccb] animate-pulse" />
              </div>
            ))}
          </section>
        )}

        {dashboard && (
          <>
            <AdminMetricsGrid metricCards={metricCards} />
            <AdminFeedbackSections
              feedbackBreakdown={dashboard.feedbackBreakdown}
              activitySummary={dashboard.activitySummary}
            />
            <AdminRecentFeedbackSection
              recentFeedback={dashboard.recentFeedback}
            />
            <AdminRecentUsersSection recentUsers={dashboard.recentUsers} />
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
