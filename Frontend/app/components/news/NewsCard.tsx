"use client";

import Link from "next/link";
import type { NewsArticle } from "./types";
import { formatNewsDate, getAnalysisStyle, getAnalysisText } from "./utils";

interface NewsCardProps {
  article: NewsArticle;
  analysis?: NewsAnalysis;
}

export type NewsAnalysis = {
  status: "loading" | "done" | "error";
  verdict?: string;
  riskLevel?: string;
  confidence?: number | null;
  fromCache?: boolean;
  cachedAt?: string;
  expiresAt?: string;
};

export default function NewsCard({ article, analysis }: NewsCardProps) {
  return (
    <article className="group h-full overflow-hidden rounded-[1.65rem] border border-(--line) bg-[#fffdfa]/85 shadow-[0_16px_30px_rgba(24,16,8,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(24,16,8,0.16)] flex flex-col">
      <div className="relative w-full h-48 overflow-hidden bg-linear-to-br from-[#e8dfcf] via-[#f7f3ea] to-[#e7dcc6]">
        {article.urlToImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#1d1712]/55 via-transparent to-transparent" />
      </div>
      <div className="p-4 md:p-5 flex flex-col grow min-w-0">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex max-w-full self-start items-center rounded-full border border-(--line) bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold text-[#4f473c]">
            {article.source.name}
          </span>
          <span className="text-xs text-[#766b5e]">
            {formatNewsDate(article.publishedAt)}
          </span>
        </div>
        <div className="mb-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getAnalysisStyle(
              analysis
            )}`}
          >
            {getAnalysisText(analysis)}
          </span>
        </div>
        <h3 className="page-title display-title text-lg sm:text-[1.3rem] font-bold text-[#17130f] mb-2 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-[#5f5548] mb-4 line-clamp-3 grow">
            {article.description}
          </p>
        )}
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#17130f] hover:text-(--accent) mt-auto inline-flex items-center gap-2"
        >
          Read story
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            -&gt;
          </span>
        </Link>
      </div>
    </article>
  );
}
