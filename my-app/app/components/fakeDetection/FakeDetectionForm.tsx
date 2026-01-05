interface FakeDetectionFormProps {
  articleText: string;
  sourceUrl: string;
  isLoading: boolean;
  error: string | null;
  onArticleChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onAnalyze: () => void;
}

export default function FakeDetectionForm({
  articleText,
  sourceUrl,
  isLoading,
  error,
  onArticleChange,
  onSourceUrlChange,
  onAnalyze,
}: FakeDetectionFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col rounded-3xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg px-6 sm:px-8 py-6 sm:py-7"
    >
      <div className="space-y-1.5 mb-4">
        <label
          htmlFor="articleText"
          className="text-sm font-medium text-gray-900"
        >
          Article Text
        </label>
        <p className="text-xs text-gray-500">
          Paste an excerpt or headline you want to analyse.
        </p>
      </div>

      <div className="mb-4 flex-1">
        <textarea
          id="articleText"
          value={articleText}
          onChange={(e) => onArticleChange(e.target.value)}
          placeholder="Paste article text here..."
          className="h-40 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 mb-4">
        <label
          htmlFor="sourceUrl"
          className="text-sm font-medium text-gray-900"
        >
          Source URL
        </label>
        <input
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => onSourceUrlChange(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
