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
      <article className="section-reveal rounded-[2rem] border border-(--line) bg-[#f7f1e6]/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
          Feedback summary
        </p>
        <h2 className="mt-3 page-title display-title text-3xl font-bold text-[#17130f]">
          Accuracy sentiment and source mix.
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
              Correct rate
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#17130f]">
              {formatPercent(feedbackBreakdown.correctRate)}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
              Web feedback
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#17130f]">
              {activitySummary.feedbackSources.web}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#867a6a]">
              Extension feedback
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#17130f]">
              {activitySummary.feedbackSources.extension}
            </p>
          </div>
        </div>
      </article>

      <article className="section-reveal delay-1 rounded-[2rem] border border-(--line) bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
          Activity summary
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-[#17130f]">Latest signup</p>
            <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
              {formatDateTime(activitySummary.latestSignupAt)}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-[#17130f]">Latest feedback</p>
            <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
              {formatDateTime(activitySummary.latestFeedbackAt)}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-(--line) bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-[#17130f]">
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
