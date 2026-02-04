"use client";

import { useState, useEffect } from "react";
import NewsCard from "./NewsCard";

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

interface NewsResponse {
  articles?: NewsArticle[];
  status?: string;
  totalResults?: number;
  error?: string;
}

interface NewsGridProps {
  country?: string;
  category?: string;
  query?: string;
}

export default function NewsGrid({
  country = "us",
  category = "",
  query = "",
}: NewsGridProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          country,
          pageSize: "20",
        });
        
        if (category) {
          params.append("category", category);
        }

        if (query) {
          params.append("q", query);
        }

        const response = await fetch(`/api/news?${params.toString()}`);
        const data: NewsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.status || "Failed to fetch news");
        }

        setNews(data.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load news");
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [country, category, query]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm">
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="mt-4 h-8 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
            <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
            <div className="mt-6 h-52 w-full bg-gray-200 rounded-2xl animate-pulse" />
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="mt-4 h-4 w-4/5 bg-gray-200 rounded-xl animate-pulse" />
            <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
            <div className="mt-6 h-4 w-1/2 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-80 rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-sm"
            >
              <div className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse" />
              <div className="mt-4 h-4 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="mt-3 h-5 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
              <div className="mt-2 h-4 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">Error loading news</p>
        <p className="text-red-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">No news articles found.</p>
        <p className="text-sm text-gray-500 mt-2">
          Try a different topic or search phrase.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = news;

  return (
    <div className="space-y-8">
      {featured && (
        <article className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center rounded-3xl border border-gray-100 bg-white/90 shadow-sm overflow-hidden">
          <div className="relative h-64 sm:h-80 lg:h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-200" />
            {featured.urlToImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.urlToImage}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase">
                Top story
              </p>
              <h3 className="text-lg sm:text-2xl font-semibold mt-2 line-clamp-2">
                {featured.title}
              </h3>
            </div>
          </div>
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="inline-flex items-center rounded-full bg-gray-900/5 px-3 py-1 text-[11px] font-semibold text-gray-700">
                {featured.source.name}
              </span>
              <span>{formatDate(featured.publishedAt)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-4 line-clamp-4">
              {featured.description || "Explore the latest on this developing story."}
            </p>
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-black"
            >
              Read the full story
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
        {rest.map((article, index) => (
          <NewsCard key={`${article.url}-${index}`} article={article} />
        ))}
      </div>
    </div>
  );
}
