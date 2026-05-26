import Button from "../ui/Button";

type FeedbackStatus = {
  type: "success" | "error";
  message: string;
} | null;

interface DetectionFeedbackCardProps {
  selectedValue: boolean | null;
  comment: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  status: FeedbackStatus;
  onSelect: (value: boolean) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

export default function DetectionFeedbackCard({
  selectedValue,
  comment,
  isSubmitting,
  isSubmitted,
  status,
  onSelect,
  onCommentChange,
  onSubmit,
}: DetectionFeedbackCardProps) {
  return (
    <section className="rounded-3xl border border-(--line) bg-(--surface)/90 px-5 sm:px-8 py-6 shadow-[0_22px_46px_rgba(24,16,8,0.1)]">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-(--muted-foreground-strong) uppercase">
          Feedback
        </p>
        <h3 className="text-xl font-semibold text-(--foreground-strong)">
          Was this prediction right?
        </h3>
        <p className="text-sm text-(--muted-foreground)">
          Tell us whether the result matched your judgment and what should be improved.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSelect(true)}
          disabled={isSubmitting || isSubmitted}
          className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
            selectedValue === true
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-(--line) bg-(--surface-strong) text-(--muted-foreground) hover:bg-(--surface-hover)"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Prediction was right
        </button>
        <button
          type="button"
          onClick={() => onSelect(false)}
          disabled={isSubmitting || isSubmitted}
          className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
            selectedValue === false
              ? "border-red-600 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200"
              : "border-(--line) bg-(--surface-strong) text-(--muted-foreground) hover:bg-(--surface-hover)"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Prediction was wrong
        </button>
      </div>

      <div className="mt-5">
        <label
          htmlFor="detection-feedback-comment"
          className="text-sm font-semibold text-(--foreground-strong)"
        >
          Comment (optional)
        </label>
        <textarea
          id="detection-feedback-comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          disabled={isSubmitting || isSubmitted}
          placeholder="Share what you noticed or what should be improved..."
          className="mt-2 min-h-28 w-full rounded-2xl border border-(--line) bg-(--surface-deep) px-4 py-3 text-sm text-(--foreground-strong) placeholder:text-(--muted-foreground)/70 dark:placeholder:text-(--muted-foreground)/90 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)/45 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {status && (
        <p
          className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200"
          }`}
        >
          {status.message}
        </p>
      )}

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-(--muted-foreground)">
          Your feedback will be stored with your account.
        </p>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitted || selectedValue === null}
          className="w-full sm:w-auto px-6"
        >
          {isSubmitted ? "Feedback sent" : isSubmitting ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </section>
  );
}
