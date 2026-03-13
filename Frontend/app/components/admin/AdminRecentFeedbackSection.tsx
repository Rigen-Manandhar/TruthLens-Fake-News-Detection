import type { AdminRecentFeedback } from "@/lib/shared/admin";
import { formatDateTime, getVerdictBadge } from "./dashboardUtils";

type AdminRecentFeedbackSectionProps = {
  recentFeedback: AdminRecentFeedback[];
};

export default function AdminRecentFeedbackSection({
  recentFeedback,
}: AdminRecentFeedbackSectionProps) {
  return (
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
        <p className="text-sm text-[var(--muted-foreground)]">Newest submissions first.</p>
      </div>

      {recentFeedback.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          No feedback has been submitted yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {recentFeedback.map((feedback) => (
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
                    <span className="text-xs text-[#7f7364]">{feedback.userEmail}</span>
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
  );
}
