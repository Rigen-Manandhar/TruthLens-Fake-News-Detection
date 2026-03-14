import type { AnalysisMap, NewsArticle } from "./types";
import {
  getNewsArticleCacheKey,
  MAX_DISPLAY_ARTICLES,
  type NewsAnalysisRequestBody,
  type NewsAnalysisResponseBody,
} from "@/lib/shared/news-analysis";

export const REQUEST_PAGE_SIZE = "30";
export { MAX_DISPLAY_ARTICLES };

export const uniqueByUrl = (articles: NewsArticle[]) => {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  for (const article of articles) {
    const url = (article.url || "").trim();
    const cacheKey = getNewsArticleCacheKey(url) ?? url;
    if (!url || seen.has(cacheKey)) {
      continue;
    }

    seen.add(cacheKey);
    unique.push(article);
  }

  return unique;
};

export const buildInitialAnalysisMap = (articles: NewsArticle[]): AnalysisMap => {
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

export const buildErrorAnalysisMap = (articles: NewsArticle[]): AnalysisMap => {
  const map: AnalysisMap = {};

  for (const article of articles) {
    const url = (article.url || "").trim();
    if (!url) {
      continue;
    }

    map[url] = { status: "error" };
  }

  return map;
};

export const requestNewsAnalysis = async (
  articles: NewsArticle[],
  signal: AbortSignal
): Promise<AnalysisMap> => {
  const payload: NewsAnalysisRequestBody = {
    articles: articles.map((article) => ({
      url: article.url,
      title: article.title,
      description: article.description,
      publishedAt: article.publishedAt,
    })),
  };

  const response = await fetch("/api/news/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const json = (await response.json().catch(() => null)) as
    | (NewsAnalysisResponseBody & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(json?.error || "Homepage analysis failed");
  }

  return json?.analysisByUrl ?? {};
};
