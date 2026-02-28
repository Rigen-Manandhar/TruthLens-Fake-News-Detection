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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  const handleClear = () => {
    onArticleChange("");
    onSourceUrlChange("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col rounded-3xl border border-[var(--line)] bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-6 sm:px-8 py-6 sm:py-7 h-[600px] overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#12100d] via-[var(--accent)] to-[#e8b074]" />

      <div className="relative flex flex-col h-full">
        <div className="space-y-1.5 mb-4">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#867a6a] uppercase">
            Input
          </p>
          <label
            htmlFor="articleText"
            className="text-sm font-semibold text-[#17130f]"
          >
            Article Text
          </label>
          <p className="text-xs text-[var(--muted-foreground)]">
            Paste an excerpt or headline you want to analyse.
          </p>
        </div>

        <div className="mb-4 flex-1">
          <textarea
            id="articleText"
            value={articleText}
            onChange={(e) => onArticleChange(e.target.value)}
            placeholder="Paste article text here..."
            className="h-full w-full resize-none rounded-2xl border border-[var(--line)] bg-[#f7f1e6] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#958878] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
          />
        </div>

        <div className="space-y-2 mb-4">
          <label
            htmlFor="inputMode"
            className="text-sm font-semibold text-[#17130f]"
          >
            Input Mode
          </label>
          <select
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
            className="w-full rounded-2xl border border-[var(--line)] bg-[#f7f1e6] px-4 py-3 text-sm text-[#17130f] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
          >
            <option value="auto">Auto detect</option>
            <option value="headline_only">Headline only</option>
            <option value="full_article">Full article</option>
            <option value="headline_plus_article">Headline + article</option>
          </select>
          <p className="text-xs text-[var(--muted-foreground)]">
            Auto mode is recommended. Use manual mode if your paste format is unusual.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <label
            htmlFor="sourceUrl"
            className="text-sm font-semibold text-[#17130f]"
          >
            Source URL
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-[var(--line)] bg-[#f7f1e6] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#958878] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Optional: include a URL to boost source credibility scoring.
          </p>
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="text-xs font-semibold text-[#7e7263] hover:text-[#17130f] disabled:opacity-50"
          >
            Clear fields
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#12100d] px-8 text-sm font-semibold text-[#f7f1e6] shadow-[0_12px_24px_rgba(24,16,8,0.22)] transition-all hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>
    </form>
  );
}
