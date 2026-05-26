import type { AdminRecentFeedback } from "@/lib/shared/admin";
import { formatDateTime, getVerdictBadge } from "./dashboardUtils";

type AdminRecentFeedbackSectionProps = {
  recentFeedback: AdminRecentFeedback[];
};

export default function AdminRecentFeedbackSection({
  recentFeedback,
}: AdminRecentFeedbackSectionProps) {
  return (
    <section className="section-reveal delay-1 rounded-4xl border border-(--line) bg-(--surface)/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
            Recent feedback
          </p>
          <h2 className="mt-2 page-title display-title text-3xl font-bold text-(--foreground-strong)">
            Latest fake-news result feedback.
          </h2>
        </div>
        <p className="text-sm text-(--muted-foreground)">Newest submissions first.</p>
      </div>

      {recentFeedback.length === 0 ? (
        <p className="mt-6 text-sm text-(--muted-foreground)">
          No feedback has been submitted yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {recentFeedback.map((feedback) => (
            <article
              key={feedback.id}
              className="rounded-3xl border border-(--line) bg-(--surface-strong) p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-(--foreground-strong)">
                      {feedback.userName}
                    </span>
                    <span className="text-xs text-(--muted-foreground)">{feedback.userEmail}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 font-semibold ${getVerdictBadge(
                        feedback
                      )}`}
                    >
                      {feedback.verdict}
                    </span>
                    <span className="inline-flex rounded-full border border-(--line) bg-(--surface-pill) px-3 py-1 font-semibold text-(--muted-foreground)">
                      {feedback.isCorrect ? "Marked correct" : "Marked wrong"}
                    </span>
                    <span className="inline-flex rounded-full border border-(--line) bg-(--surface) px-3 py-1 font-semibold text-(--muted-foreground)">
                      {feedback.source}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-(--muted-foreground)">
                  {formatDateTime(feedback.createdAt)}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
                <div className="rounded-[1.25rem] border border-dashed border-(--line) bg-(--surface-deep) px-4 py-3 text-sm leading-6 text-(--foreground)">
                  {feedback.comment || "No comment was provided for this feedback entry."}
                </div>
                <div className="rounded-[1.25rem] border border-(--line) bg-(--surface) px-4 py-3 text-sm text-(--muted-foreground)">
                  <p>
                    <span className="font-semibold text-(--foreground-strong)">Risk:</span>{" "}
                    {feedback.riskLevel}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-(--foreground-strong)">Input mode:</span>{" "}
                    {feedback.inputMode}
                  </p>
                  <p className="mt-2 break-all">
                    <span className="font-semibold text-(--foreground-strong)">URL:</span>{" "}
                    {feedback.url || "N/A"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
