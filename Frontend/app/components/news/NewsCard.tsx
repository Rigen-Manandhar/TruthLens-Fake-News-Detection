"use client";

import Link from "next/link";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsCardProps {
  article: NewsArticle;
  analysis?: NewsAnalysis;
}

export type NewsAnalysis = {
  status: "loading" | "done" | "error";
  verdict?: string;
  riskLevel?: string;
  confidence?: number | null;
};

const getAnalysisStyle = (analysis?: NewsAnalysis) => {
  if (!analysis || analysis.status === "loading") {
    return "border-sky-200/80 bg-sky-50 text-sky-900";
  }

  if (analysis.status === "error") {
    return "border-[#d6ccbd] bg-[#efe8da] text-[#6b6257]";
  }

  const verdict = (analysis.verdict || "").toUpperCase();
  if (verdict === "LIKELY REAL") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (verdict === "SUSPICIOUS") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
};

const getAnalysisText = (analysis?: NewsAnalysis) => {
  if (!analysis || analysis.status === "loading") {
    return "Analyzing...";
  }

  if (analysis.status === "error") {
    return "Analysis unavailable";
  }

  const label = analysis.verdict || "UNCERTAIN";
  const confidence =
    typeof analysis.confidence === "number"
      ? `${Math.round(analysis.confidence * 100)}%`
      : null;

  return confidence ? `${label} ${confidence}` : label;
};

export default function NewsCard({ article, analysis }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <article className="group h-full overflow-hidden rounded-[1.65rem] border border-[var(--line)] bg-[#fffdfa]/85 shadow-[0_16px_30px_rgba(24,16,8,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(24,16,8,0.16)] flex flex-col">
      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-[#e8dfcf] via-[#f7f3ea] to-[#e7dcc6]">
        {article.urlToImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1d1712]/55 via-transparent to-transparent" />
      </div>
      <div className="p-4 md:p-5 flex flex-col grow">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold text-[#4f473c]">
            {article.source.name}
          </span>
          <span className="text-xs text-[#766b5e]">
            {formatDate(article.publishedAt)}
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
        <h3 className="display-title text-lg sm:text-[1.3rem] font-bold text-[#17130f] mb-2 line-clamp-2">
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
          className="text-sm font-semibold text-[#17130f] hover:text-[var(--accent)] mt-auto inline-flex items-center gap-2"
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
