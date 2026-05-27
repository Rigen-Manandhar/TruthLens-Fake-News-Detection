import type { AdminActivitySummary, AdminFeedbackBreakdown } from "@/lib/shared/admin";
import { formatDateTime, formatPercent } from "./dashboardUtils";

type AdminFeedbackSectionsProps = {
  feedbackBreakdown: AdminFeedbackBreakdown;
  activitySummary: AdminActivitySummary;
};

export default function AdminFeedbackSections({
  feedbackBreakdown,
  activitySummary,
}: AdminFeedbackSectionsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
      <article className="section-reveal rounded-4xl border border-(--line) bg-(--surface-deep)/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
          Feedback summary
        </p>
        <h2 className="mt-3 page-title display-title text-3xl font-bold text-(--foreground-strong)">
          Accuracy sentiment and source mix.
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
              Correct rate
            </p>
            <p className="mt-3 text-2xl font-semibold text-(--foreground-strong)">
              {formatPercent(feedbackBreakdown.correctRate)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
              Web feedback
            </p>
            <p className="mt-3 text-2xl font-semibold text-(--foreground-strong)">
              {activitySummary.feedbackSources.web}
            </p>
          </div>
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
              Extension feedback
            </p>
            <p className="mt-3 text-2xl font-semibold text-(--foreground-strong)">
              {activitySummary.feedbackSources.extension}
            </p>
          </div>
        </div>
      </article>

      <article className="section-reveal delay-1 rounded-4xl border border-(--line) bg-(--surface)/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
          Activity summary
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-sm font-semibold text-(--foreground-strong)">Latest signup</p>
            <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
              {formatDateTime(activitySummary.latestSignupAt)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-sm font-semibold text-(--foreground-strong)">Latest feedback</p>
            <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
              {formatDateTime(activitySummary.latestFeedbackAt)}
            </p>
          </div>
          <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
            <p className="text-sm font-semibold text-(--foreground-strong)">
              Other feedback sources
            </p>
            <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
              {activitySummary.feedbackSources.other}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
