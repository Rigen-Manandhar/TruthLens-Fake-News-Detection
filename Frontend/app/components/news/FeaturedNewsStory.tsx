import type { NewsAnalysis } from "./NewsCard";
import type { NewsArticle } from "./types";
import { formatNewsDate, getAnalysisStyle, getAnalysisText } from "./utils";

type FeaturedNewsStoryProps = {
  article: NewsArticle;
  analysis?: NewsAnalysis;
};

export default function FeaturedNewsStory({
  article,
  analysis,
}: FeaturedNewsStoryProps) {
  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/90 shadow-[0_18px_36px_rgba(24,16,8,0.1)] overflow-hidden">
      <div className="relative h-56 sm:h-72 lg:h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8dfcf] via-[#f7f3ea] to-[#e7dcc6]" />
        {article.urlToImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1510]/80 via-[#201810]/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-[#f8f2e7]">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase">
            Top story
          </p>
          <h3 className="page-title display-title text-xl sm:text-3xl font-bold mt-2 line-clamp-2">
            {article.title}
          </h3>
        </div>
      </div>
      <div className="min-w-0 p-5 sm:p-7">
        <div className="flex flex-col gap-2 text-xs text-[#6f6457] sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex max-w-full self-start items-center rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold text-[#4f473c]">
            {article.source.name}
          </span>
          <span>{formatNewsDate(article.publishedAt)}</span>
        </div>
        <div className="mt-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getAnalysisStyle(
              analysis
            )}`}
          >
            {getAnalysisText(analysis)}
          </span>
        </div>
        <p className="text-sm text-[#5f5548] mt-4 line-clamp-4">
          {article.description || "Explore the latest on this developing story."}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
        >
          Read the full story
          <span aria-hidden="true">-&gt;</span>
        </a>
      </div>
    </article>
  );
}
