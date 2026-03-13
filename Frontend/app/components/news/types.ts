import type { NewsAnalysis } from "./NewsCard";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
}

export interface NewsResponse {
  articles?: NewsArticle[];
  status?: string;
  totalResults?: number;
  error?: string;
}

export interface PredictResponse {
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

export interface NewsGridProps {
  country?: string;
  category?: string;
  query?: string;
}

export type AnalysisMap = Record<string, NewsAnalysis>;
