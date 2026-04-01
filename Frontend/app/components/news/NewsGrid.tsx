"use client";

import { useEffect, useRef, useState } from "react";
import FeaturedNewsStory from "./FeaturedNewsStory";
import NewsCard from "./NewsCard";
import {
  buildErrorAnalysisMap,
  buildInitialAnalysisMap,
  MAX_DISPLAY_ARTICLES,
  REQUEST_PAGE_SIZE,
  requestNewsAnalysis,
  uniqueByUrl,
} from "./newsAnalysis";
import type { AnalysisMap, NewsArticle, NewsGridProps, NewsResponse } from "./types";

export default function NewsGrid({
  country = "us",
  category = "",
  query = "",
}: NewsGridProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [analysisByUrl, setAnalysisByUrl] = useState<AnalysisMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const runId = ++runIdRef.current;

    const analyzeInBackground = async (articles: NewsArticle[]) => {
      try {
        const analysisByUrl = await requestNewsAnalysis(articles, controller.signal);

        if (controller.signal.aborted || runIdRef.current !== runId) {
          return;
        }

        setAnalysisByUrl((prev) => ({
          ...prev,
          ...analysisByUrl,
        }));
      } catch (analysisError) {
        if (controller.signal.aborted || runIdRef.current !== runId) {
          return;
        }

        setAnalysisByUrl(buildErrorAnalysisMap(articles));
        console.error("Error analyzing news:", analysisError);
      }
    };

    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          country,
          pageSize: REQUEST_PAGE_SIZE,
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

        const fetchedArticles = data.articles || [];
        const articles = uniqueByUrl(fetchedArticles).slice(0, MAX_DISPLAY_ARTICLES);

        if (runIdRef.current !== runId || controller.signal.aborted) {
          return;
        }

        setNews(articles);
        setAnalysisByUrl(buildInitialAnalysisMap(articles));

        void analyzeInBackground(articles);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load news");
        setNews([]);
        setAnalysisByUrl({});
        console.error("Error fetching news:", err);
      } finally {
        if (!controller.signal.aborted && runIdRef.current === runId) {
          setLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      controller.abort();
    };
  }, [country, category, query]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-(--line) bg-[#fffdfa]/85 p-6 shadow-[0_16px_30px_rgba(24,16,8,0.09)]">
            <div className="h-6 w-24 bg-[#e6dccb] rounded-full animate-pulse" />
            <div className="mt-4 h-8 w-3/4 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-3 h-4 w-2/3 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-6 h-52 w-full bg-[#e6dccb] rounded-2xl animate-pulse" />
          </div>
          <div className="rounded-3xl border border-(--line) bg-[#fffdfa]/85 p-6 shadow-[0_16px_30px_rgba(24,16,8,0.09)]">
            <div className="h-6 w-20 bg-[#e6dccb] rounded-full animate-pulse" />
            <div className="mt-4 h-4 w-4/5 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-3 h-4 w-2/3 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-6 h-4 w-1/2 bg-[#e6dccb] rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-80 rounded-3xl border border-(--line) bg-[#fffdfa]/85 p-4 shadow-[0_16px_30px_rgba(24,16,8,0.09)]"
            >
              <div className="h-40 w-full bg-[#e6dccb] rounded-2xl animate-pulse" />
              <div className="mt-4 h-4 w-24 bg-[#e6dccb] rounded-full animate-pulse" />
              <div className="mt-3 h-5 w-3/4 bg-[#e6dccb] rounded-xl animate-pulse" />
              <div className="mt-2 h-4 w-2/3 bg-[#e6dccb] rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-semibold">Error loading news</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#5f5548]">No news articles found.</p>
        <p className="text-sm text-[#786d61] mt-2">
          Try a different topic or search phrase.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = news;
  const featuredAnalysis = featured ? analysisByUrl[featured.url] : undefined;
  const fillerArticle = rest.length > 0 && rest.length % 3 === 2
    ? rest[rest.length - 1]
    : null;

  return (
      <div className="space-y-8">
      {featured && <FeaturedNewsStory article={featured} analysis={featuredAnalysis} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
        {rest.map((article, index) => (
          <NewsCard
            key={`${article.url}-${index}`}
            article={article}
            analysis={analysisByUrl[article.url]}
          />
        ))}

        {fillerArticle && (
          <div className="hidden lg:block">
            <NewsCard
              key={`filler-${fillerArticle.url}`}
              article={fillerArticle}
              analysis={analysisByUrl[fillerArticle.url]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
