import type { Db } from "mongodb";
import {
  getHomepageFallbackText,
  getNewsArticleCacheKey,
  type NewsAnalysisRequestArticle,
  type NewsAnalysisSummary,
} from "@/lib/shared/news-analysis";

const CACHE_COLLECTION = "news_prediction_cache";
const SUCCESS_TTL_MS = 60 * 60 * 1000;
const ERROR_TTL_MS = 10 * 60 * 1000;
const ANALYSIS_CONCURRENCY = 2;
const TITLE_SNAPSHOT_LIMIT = 300;

type PredictResponse = {
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
};

type CacheRecord = {
  normalizedUrl: string;
  sourceUrl: string;
  verdict?: string;
  riskLevel?: string;
  confidence?: number | null;
  status: "done" | "error";
  analysisSource: "url" | "fallback_text";
  cachedAt: Date;
  expiresAt: Date;
  failureExpiresAt?: Date | null;
  publishedAt?: string | null;
  titleSnapshot?: string | null;
};

type PreparedArticle = NewsAnalysisRequestArticle & {
  cacheKey: string;
};

type AnalyzedArticle = {
  article: PreparedArticle;
  response: NewsAnalysisSummary;
  record?: CacheRecord;
};

function extractPrimaryConfidence(prediction: PredictResponse): number | null {
  const modelB = prediction.model_outputs?.model_b;
  if (modelB?.ran && typeof modelB.confidence === "number") {
    return modelB.confidence;
  }

  const modelA = prediction.model_outputs?.model_a;
  if (modelA?.ran && typeof modelA.confidence === "number") {
    return modelA.confidence;
  }

  return null;
}

function toResponseSummary(
  record: Pick<
    CacheRecord,
    "status" | "verdict" | "riskLevel" | "confidence" | "cachedAt" | "expiresAt"
  >,
  fromCache: boolean
): NewsAnalysisSummary {
  return {
    status: record.status,
    verdict: record.verdict,
    riskLevel: record.riskLevel,
    confidence: record.confidence ?? null,
    cachedAt: record.cachedAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    fromCache,
  };
}

function buildSuccessRecord(
  article: PreparedArticle,
  prediction: PredictResponse,
  analysisSource: "url" | "fallback_text"
): CacheRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SUCCESS_TTL_MS);

  return {
    normalizedUrl: article.cacheKey,
    sourceUrl: article.url,
    verdict: prediction.verdict ?? "UNCERTAIN",
    riskLevel: prediction.risk_level ?? "Needs Review",
    confidence: extractPrimaryConfidence(prediction),
    status: "done",
    analysisSource,
    cachedAt: now,
    expiresAt,
    failureExpiresAt: null,
    publishedAt: article.publishedAt ?? null,
    titleSnapshot: article.title.trim().slice(0, TITLE_SNAPSHOT_LIMIT) || null,
  };
}

function buildTransientErrorSummary(): NewsAnalysisSummary {
  return {
    status: "error",
    fromCache: false,
  };
}

async function runBackendPredict(payload: {
  text: string;
  url: string;
  input_mode: "auto";
}): Promise<PredictResponse> {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(`${backend}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      explanation_mode: "none",
    }),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as PredictResponse | null;
  if (!response.ok) {
    throw new Error(json?.detail || "Prediction failed");
  }

  return json ?? {};
}

async function analyzeArticle(article: PreparedArticle): Promise<AnalyzedArticle> {
  const fallbackText = getHomepageFallbackText(article);
  let encounteredTransientFailure = false;

  try {
    const primary = await runBackendPredict({
      text: "",
      url: article.url,
      input_mode: "auto",
    });
    const primaryRecord = buildSuccessRecord(article, primary, "url");

    if (primaryRecord.confidence !== null || fallbackText.length < 10) {
      return {
        article,
        response: toResponseSummary(primaryRecord, false),
        record: primaryRecord,
      };
    }
  } catch {
    encounteredTransientFailure = true;
  }

  if (fallbackText.length >= 10) {
    try {
      const fallback = await runBackendPredict({
        text: fallbackText,
        url: article.url,
        input_mode: "auto",
      });
      const fallbackRecord = buildSuccessRecord(article, fallback, "fallback_text");
      return {
        article,
        response: toResponseSummary(fallbackRecord, false),
        record: fallbackRecord,
      };
    } catch {
      encounteredTransientFailure = true;
    }
  }

  const now = new Date();
  const errorExpiresAt = new Date(now.getTime() + ERROR_TTL_MS);
  const errorRecord: CacheRecord = {
    normalizedUrl: article.cacheKey,
    sourceUrl: article.url,
    status: "error",
    analysisSource: "url",
    cachedAt: now,
    expiresAt: errorExpiresAt,
    failureExpiresAt: errorExpiresAt,
    publishedAt: article.publishedAt ?? null,
    titleSnapshot: article.title.trim().slice(0, TITLE_SNAPSHOT_LIMIT) || null,
  };

  if (encounteredTransientFailure) {
    return {
      article,
      response: buildTransientErrorSummary(),
    };
  }

  return {
    article,
    response: toResponseSummary(errorRecord, false),
    record: errorRecord,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex] as T);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker())
  );

  return results;
}

export function prepareHomepageArticles(
  articles: NewsAnalysisRequestArticle[],
  maxArticles: number
) {
  const prepared: PreparedArticle[] = [];
  const seen = new Set<string>();

  for (const article of articles) {
    const url = typeof article.url === "string" ? article.url.trim() : "";
    const title = typeof article.title === "string" ? article.title.trim() : "";

    if (!url || !title) {
      continue;
    }

    const cacheKey = getNewsArticleCacheKey(url);
    if (!cacheKey || seen.has(cacheKey)) {
      continue;
    }

    seen.add(cacheKey);
    prepared.push({
      url,
      title,
      description: typeof article.description === "string" ? article.description : "",
      publishedAt:
        typeof article.publishedAt === "string" ? article.publishedAt : undefined,
      cacheKey,
    });

    if (prepared.length >= maxArticles) {
      break;
    }
  }

  return prepared;
}

export async function analyzeHomepageArticles(
  db: Db,
  articles: PreparedArticle[]
): Promise<Record<string, NewsAnalysisSummary>> {
  if (articles.length === 0) {
    return {};
  }

  const collection = db.collection<CacheRecord>(CACHE_COLLECTION);
  const now = new Date();
  const cacheKeys = articles.map((article) => article.cacheKey);

  const cachedRecords = await collection
    .find({
      normalizedUrl: { $in: cacheKeys },
      expiresAt: { $gt: now },
    })
    .toArray();

  const cachedByKey = new Map(
    cachedRecords.map((record) => [record.normalizedUrl, record] as const)
  );

  const analysisByUrl: Record<string, NewsAnalysisSummary> = {};
  const misses: PreparedArticle[] = [];

  for (const article of articles) {
    const cached = cachedByKey.get(article.cacheKey);
    if (cached) {
      analysisByUrl[article.url] = toResponseSummary(cached, true);
      continue;
    }

    misses.push(article);
  }

  if (misses.length === 0) {
    return analysisByUrl;
  }

  const analyzed = await mapWithConcurrency(misses, ANALYSIS_CONCURRENCY, analyzeArticle);

  const cacheableRecords = analyzed.filter(
    (item): item is AnalyzedArticle & { record: CacheRecord } => Boolean(item.record)
  );

  if (cacheableRecords.length > 0) {
    await collection.bulkWrite(
      cacheableRecords.map(({ record }) => ({
      updateOne: {
        filter: { normalizedUrl: record.normalizedUrl },
        update: { $set: record },
        upsert: true,
      },
      }))
    );
  }

  for (const { article, response } of analyzed) {
    analysisByUrl[article.url] = response;
  }

  return analysisByUrl;
}
