"use client";

import { useEffect, useRef, useState } from "react";
import NewsCard, { type NewsAnalysis } from "./NewsCard";

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

interface PredictResponse {
  verdict?: string;
  risk_level?: string;
  model_outputs?: {
    model_a?: {
      ran?: boolean;
      confidence?: number | null;
    };
    model_b?: {
      ran?: boolean;
      confidence?: number | null;
    };
  };
  detail?: string;
}

interface NewsGridProps {
  country?: string;
  category?: string;
  query?: string;
}

const ANALYSIS_CONCURRENCY = 3;
const ANALYSIS_PRIORITY_COUNT = 6;
const REQUEST_PAGE_SIZE = "30";
const MAX_DISPLAY_ARTICLES = 19;

type AnalysisMap = Record<string, NewsAnalysis>;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

const extractPrimaryConfidence = (prediction: PredictResponse): number | null => {
  const modelB = prediction.model_outputs?.model_b;
  if (modelB?.ran && typeof modelB.confidence === "number") {
    return modelB.confidence;
  }

  const modelA = prediction.model_outputs?.model_a;
  if (modelA?.ran && typeof modelA.confidence === "number") {
    return modelA.confidence;
  }

  return null;
};

const toAnalysis = (prediction: PredictResponse): NewsAnalysis => ({
  status: "done",
  verdict: prediction.verdict ?? "UNCERTAIN",
  riskLevel: prediction.risk_level ?? "Needs Review",
  confidence: extractPrimaryConfidence(prediction),
});

const getFallbackText = (article: NewsArticle) =>
  `${article.title || ""}. ${article.description || ""}`.trim();

const uniqueByUrl = (articles: NewsArticle[]) => {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  for (const article of articles) {
    const url = (article.url || "").trim();
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    unique.push(article);
  }

  return unique;
};

const buildInitialAnalysisMap = (articles: NewsArticle[]): AnalysisMap => {
  const map: AnalysisMap = {};

  for (const article of articles) {
    const url = (article.url || "").trim();
    if (!url) {
      continue;
    }

    map[url] = { status: "loading" };
  }

  return map;
};

const runPredict = async (
  payload: { text: string; url: string; input_mode: "auto" },
  signal: AbortSignal
): Promise<PredictResponse> => {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      explanation_mode: "none",
    }),
    signal,
  });

  const json = (await response.json().catch(() => null)) as PredictResponse | null;

  if (!response.ok) {
    throw new Error(json?.detail || "Prediction failed");
  }

  return json ?? {};
};

const analyzeArticle = async (article: NewsArticle, signal: AbortSignal): Promise<NewsAnalysis> => {
  const fallbackText = getFallbackText(article);

  try {
    const primary = await runPredict(
      { text: "", url: article.url, input_mode: "auto" },
      signal
    );
    const primaryAnalysis = toAnalysis(primary);

    if (primaryAnalysis.confidence !== null || fallbackText.length < 10) {
      return primaryAnalysis;
    }

    const fallback = await runPredict(
      { text: fallbackText, url: article.url, input_mode: "auto" },
      signal
    );
    return toAnalysis(fallback);
  } catch {
    if (fallbackText.length >= 10) {
      const fallback = await runPredict(
        { text: fallbackText, url: article.url, input_mode: "auto" },
        signal
      );
      return toAnalysis(fallback);
    }

    throw new Error("Analysis failed");
  }
};

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
      const uniqueArticles = uniqueByUrl(articles);
      const prioritized = [
        ...uniqueArticles.slice(0, ANALYSIS_PRIORITY_COUNT),
        ...uniqueArticles.slice(ANALYSIS_PRIORITY_COUNT),
      ];

      let cursor = 0;

      const worker = async () => {
        while (cursor < prioritized.length) {
          const currentIndex = cursor;
          cursor += 1;

          const article = prioritized[currentIndex];
          if (!article) {
            continue;
          }

          if (controller.signal.aborted || runIdRef.current !== runId) {
            return;
          }

          try {
            const analysis = await analyzeArticle(article, controller.signal);

            if (controller.signal.aborted || runIdRef.current !== runId) {
              return;
            }

            setAnalysisByUrl((prev) => ({
              ...prev,
              [article.url]: analysis,
            }));
          } catch {
            if (controller.signal.aborted || runIdRef.current !== runId) {
              return;
            }

            setAnalysisByUrl((prev) => ({
              ...prev,
              [article.url]: {
                status: "error",
              },
            }));
          }
        }
      };

      const workerCount = Math.min(ANALYSIS_CONCURRENCY, prioritized.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
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
          <div className="rounded-3xl border border-[var(--line)] bg-[#fffdfa]/85 p-6 shadow-[0_16px_30px_rgba(24,16,8,0.09)]">
            <div className="h-6 w-24 bg-[#e6dccb] rounded-full animate-pulse" />
            <div className="mt-4 h-8 w-3/4 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-3 h-4 w-2/3 bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-6 h-52 w-full bg-[#e6dccb] rounded-2xl animate-pulse" />
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[#fffdfa]/85 p-6 shadow-[0_16px_30px_rgba(24,16,8,0.09)]">
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
              className="h-80 rounded-3xl border border-[var(--line)] bg-[#fffdfa]/85 p-4 shadow-[0_16px_30px_rgba(24,16,8,0.09)]"
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
      {featured && (
        <article className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/90 shadow-[0_18px_36px_rgba(24,16,8,0.1)] overflow-hidden">
          <div className="relative h-56 sm:h-72 lg:h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8dfcf] via-[#f7f3ea] to-[#e7dcc6]" />
            {featured.urlToImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.urlToImage}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b1510]/80 via-[#201810]/20 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-[#f8f2e7]">
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase">
                Top story
              </p>
              <h3 className="page-title display-title text-xl sm:text-3xl font-bold mt-2 line-clamp-2">
                {featured.title}
              </h3>
            </div>
          </div>
          <div className="min-w-0 p-5 sm:p-7">
            <div className="flex flex-col gap-2 text-xs text-[#6f6457] sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex max-w-full self-start items-center rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold text-[#4f473c]">
                {featured.source.name}
              </span>
              <span>{formatDate(featured.publishedAt)}</span>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getAnalysisStyle(
                  featuredAnalysis
                )}`}
              >
                {getAnalysisText(featuredAnalysis)}
              </span>
            </div>
            <p className="text-sm text-[#5f5548] mt-4 line-clamp-4">
              {featured.description || "Explore the latest on this developing story."}
            </p>
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
            >
              Read the full story
              <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </article>
      )}

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
