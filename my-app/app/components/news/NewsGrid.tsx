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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading news...</p>
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
      {news.map((article, index) => (
        <NewsCard key={`${article.url}-${index}`} article={article} />
      ))}
    </div>
  );
}
