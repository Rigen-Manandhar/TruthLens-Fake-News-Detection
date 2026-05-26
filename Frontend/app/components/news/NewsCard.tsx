"use client";

import Link from "next/link";
import type { NewsArticle } from "./types";
import {
  formatNewsDate,
  getAnalysisConfidence,
  getAnalysisLabel,
  getAnalysisStyle,
  getVerdictAccentClass,
} from "./utils";
import { ArrowRight } from "../ui/icons";

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
  const label = getAnalysisLabel(analysis);
  const confidence = getAnalysisConfidence(analysis);
  const accentClass = getVerdictAccentClass(analysis);

  return (
    <article className="group relative h-full overflow-hidden rounded-[1.65rem] border border-(--line) bg-(--surface)/85 shadow-[0_16px_30px_rgba(24,16,8,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(24,16,8,0.16)] flex flex-col">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-linear-to-r ${accentClass}`}
      />
      <div className="relative w-full h-48 overflow-hidden bg-linear-to-br from-(--surface-pill) via-(--surface-deep) to-(--surface-pill)">
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
          <span className="inline-flex max-w-full self-start items-center rounded-full border border-(--line) bg-(--surface-pill) px-3 py-1 text-[11px] font-semibold text-(--foreground)">
            {article.source.name}
          </span>
          <span className="text-xs text-(--muted-foreground)">
            {formatNewsDate(article.publishedAt)}
          </span>
        </div>
        <div className="mb-3">
          <span
            className={`inline-flex flex-col gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${getAnalysisStyle(
              analysis
            )}`}
          >
            <span className="flex items-center gap-1">
              <span>{label}</span>
              {confidence !== null && (
                <span className="text-[10px] opacity-80">{confidence}%</span>
              )}
            </span>
            {confidence !== null && (
              <span
                aria-hidden
                className="block h-[2px] w-full overflow-hidden rounded-full bg-current/20"
              >
                <span
                  className="block h-full bg-current"
                  style={{ width: `${confidence}%` }}
                />
              </span>
            )}
          </span>
        </div>
        <h3 className="page-title display-title text-lg sm:text-[1.3rem] font-bold text-(--foreground-strong) mb-2 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-(--muted-foreground) mb-4 line-clamp-3 grow">
            {article.description}
          </p>
        )}
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-(--foreground-strong) hover:text-(--accent) mt-auto inline-flex items-center gap-2"
        >
          Read story
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}
