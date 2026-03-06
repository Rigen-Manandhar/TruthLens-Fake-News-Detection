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
    <section className="rounded-3xl border border-[var(--line)] bg-[#fffdfa]/90 px-5 sm:px-8 py-6 shadow-[0_22px_46px_rgba(24,16,8,0.1)]">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#867a6a] uppercase">
          Feedback
        </p>
        <h3 className="text-xl font-semibold text-[#17130f]">
          Was this prediction right?
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
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
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-[var(--line)] bg-[#fffdf8] text-[#5f5548] hover:bg-[#f4eee2]"
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
              ? "border-red-600 bg-red-50 text-red-800"
              : "border-[var(--line)] bg-[#fffdf8] text-[#5f5548] hover:bg-[#f4eee2]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          Prediction was wrong
        </button>
      </div>

      <div className="mt-5">
        <label
          htmlFor="detection-feedback-comment"
          className="text-sm font-semibold text-[#17130f]"
        >
          Comment (optional)
        </label>
        <textarea
          id="detection-feedback-comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          disabled={isSubmitting || isSubmitted}
          placeholder="Share what you noticed or what should be improved..."
          className="mt-2 min-h-28 w-full rounded-2xl border border-[var(--line)] bg-[#f7f1e6] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#958878] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {status && (
        <p
          className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </p>
      )}

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#7f7364]">
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
