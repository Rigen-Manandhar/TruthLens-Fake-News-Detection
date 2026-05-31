import Select from "../ui/Select";
import Textarea from "../ui/Textarea";

interface FakeDetectionFormProps {
  articleText: string;
  sourceUrl: string;
  inputMode: "auto" | "headline_only" | "full_article" | "headline_plus_article";
  isLoading: boolean;
  error: string | null;
  onArticleChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onInputModeChange: (
    value: "auto" | "headline_only" | "full_article" | "headline_plus_article"
  ) => void;
  onAnalyze: () => void;
}

export default function FakeDetectionForm({
  articleText,
  sourceUrl,
  inputMode,
  isLoading,
  error,
  onArticleChange,
  onSourceUrlChange,
  onInputModeChange,
  onAnalyze,
}: FakeDetectionFormProps) {
  const hasArticleText = articleText.trim().length > 0;
  const hasSourceUrl = sourceUrl.trim().length > 0;
  const hasMixedInput = hasArticleText && hasSourceUrl;
  const mixedInputWarning =
    "Use either pasted article text or a source URL, not both. Clear one field before assessing risk.";
  const canAssess = !isLoading && !hasMixedInput;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssess) {
      return;
    }
    onAnalyze();
  };

  const handleClear = () => {
    onArticleChange("");
    onSourceUrlChange("");
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canAssess) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col rounded-3xl border border-(--line) bg-(--surface)/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--ink) via-(--accent) to-(--warm)" />

      <div className="relative flex flex-col">
        <div className="mb-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-(--muted-foreground-strong) uppercase">
              Input
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Textarea
            label="Article text"
            id="articleText"
            value={articleText}
            onChange={(e) => onArticleChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Paste article text here..."
            helperText="Paste an excerpt or headline you want to assess."
            className="min-h-56 sm:min-h-72 resize-y lg:resize-none"
          />
        </div>

        <div className="mb-4">
          <Select
            label="Input mode"
            id="inputMode"
            value={inputMode}
            onChange={(e) =>
              onInputModeChange(
                e.target.value as
                  | "auto"
                  | "headline_only"
                  | "full_article"
                  | "headline_plus_article"
              )
            }
            helperText="Auto mode is recommended. Use manual mode if your paste format is unusual."
          >
            <option value="auto">Auto assess</option>
            <option value="headline_only">Headline only</option>
            <option value="full_article">Full article</option>
            <option value="headline_plus_article">Headline + article</option>
          </Select>
        </div>

        <div className="space-y-2 mb-4">
          <label
            htmlFor="sourceUrl"
            className="text-sm font-semibold text-(--foreground-strong)"
          >
            Source URL
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-(--line) bg-(--surface-deep) px-4 py-3 text-sm text-(--foreground-strong) placeholder:text-(--muted-foreground)/70 dark:placeholder:text-(--muted-foreground)/90 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)/45"
          />
          <p className="text-xs text-(--muted-foreground)">
            Use this instead of pasted text when you want TruthLens to fetch the article.
          </p>
        </div>

        {hasMixedInput && (
          <p className="mb-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-200 px-3 py-2">
            {mixedInputWarning}
          </p>
        )}

        {error && (
          <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-500/10 dark:border-red-400/30 dark:text-red-200 px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="text-xs font-semibold text-(--muted-foreground) hover:text-(--foreground-strong) disabled:opacity-50"
          >
            Clear fields
          </button>
          <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-(--muted-foreground)">
              <kbd className="rounded-md border border-(--line) bg-(--surface-strong) px-1.5 py-0.5 font-mono text-[10px] text-(--foreground-strong)">
                Ctrl
              </kbd>
              <span aria-hidden>+</span>
              <kbd className="rounded-md border border-(--line) bg-(--surface-strong) px-1.5 py-0.5 font-mono text-[10px] text-(--foreground-strong)">
                Enter
              </kbd>
              <span className="ml-1">to assess</span>
            </span>
            <button
              type="submit"
              disabled={!canAssess}
              title={hasMixedInput ? mixedInputWarning : undefined}
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-full bg-(--ink) px-8 text-sm font-semibold text-(--ink-foreground) shadow-[0_12px_24px_rgba(24,16,8,0.22)] transition-all hover:bg-(--accent) disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
            >
              {isLoading ? "Assessing..." : "Assess Risk"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
