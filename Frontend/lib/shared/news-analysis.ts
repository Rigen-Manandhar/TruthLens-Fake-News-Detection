export const MAX_DISPLAY_ARTICLES = 19;

export type NewsAnalysisRequestArticle = {
  url: string;
  title: string;
  description?: string;
  publishedAt?: string;
};

export type NewsAnalysisSummary = {
  status: "done" | "error";
  verdict?: string;
  riskLevel?: string;
  confidence?: number | null;
  cachedAt?: string;
  expiresAt?: string;
  fromCache: boolean;
};

export type NewsAnalysisRequestBody = {
  articles: NewsAnalysisRequestArticle[];
};

export type NewsAnalysisResponseBody = {
  analysisByUrl: Record<string, NewsAnalysisSummary>;
};

const TRACKING_PARAM_NAMES = new Set(["fbclid", "gclid"]);

export function normalizeNewsArticleUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (
    (parsed.protocol === "https:" && parsed.port === "443") ||
    (parsed.protocol === "http:" && parsed.port === "80")
  ) {
    parsed.port = "";
  }

  const keptParams = [...parsed.searchParams.entries()]
    .filter(([key]) => {
      const lowerKey = key.toLowerCase();
      return !lowerKey.startsWith("utm_") && !TRACKING_PARAM_NAMES.has(lowerKey);
    })
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = leftKey.localeCompare(rightKey);
      if (keyOrder !== 0) {
        return keyOrder;
      }
      return leftValue.localeCompare(rightValue);
    });

  parsed.search = "";
  for (const [key, value] of keptParams) {
    parsed.searchParams.append(key, value);
  }

  return parsed.toString();
}

export function getNewsArticleCacheKey(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  return normalizeNewsArticleUrl(trimmed) ?? `raw:${trimmed}`;
}

export function getHomepageFallbackText(input: {
  title?: string | null;
  description?: string | null;
}) {
  return `${input.title || ""}. ${input.description || ""}`.trim();
}
