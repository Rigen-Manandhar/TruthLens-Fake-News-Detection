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
}

export default function NewsCard({ article }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <article className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 via-white to-gray-200 overflow-hidden">
        {article.urlToImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4 md:p-5 flex flex-col grow">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center rounded-full bg-gray-900/5 px-3 py-1 text-[11px] font-semibold text-gray-700">
            {article.source.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 grow">
            {article.description}
          </p>
        )}
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gray-900 hover:text-black mt-auto inline-flex items-center gap-2"
        >
          Read story
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
