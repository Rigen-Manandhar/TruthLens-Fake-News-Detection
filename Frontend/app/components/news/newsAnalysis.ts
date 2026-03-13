import type { NewsAnalysis } from "./NewsCard";
import type { AnalysisMap, NewsArticle, PredictResponse } from "./types";

export const ANALYSIS_CONCURRENCY = 3;
export const ANALYSIS_PRIORITY_COUNT = 6;
export const REQUEST_PAGE_SIZE = "30";
export const MAX_DISPLAY_ARTICLES = 19;

export const extractPrimaryConfidence = (prediction: PredictResponse): number | null => {
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

export const toAnalysis = (prediction: PredictResponse): NewsAnalysis => ({
  status: "done",
  verdict: prediction.verdict ?? "UNCERTAIN",
  riskLevel: prediction.risk_level ?? "Needs Review",
  confidence: extractPrimaryConfidence(prediction),
});

export const getFallbackText = (article: NewsArticle) =>
  `${article.title || ""}. ${article.description || ""}`.trim();

export const uniqueByUrl = (articles: NewsArticle[]) => {
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

export const runPredict = async (
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

export const analyzeArticle = async (
  article: NewsArticle,
  signal: AbortSignal
): Promise<NewsAnalysis> => {
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
