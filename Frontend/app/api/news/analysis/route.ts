import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-client";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  analyzeHomepageArticles,
  prepareHomepageArticles,
} from "@/lib/server/news-analysis-cache";
import {
  MAX_DISPLAY_ARTICLES,
  type NewsAnalysisRequestBody,
  type NewsAnalysisRequestArticle,
} from "@/lib/shared/news-analysis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as NewsAnalysisRequestBody | null;
  if (!body || !Array.isArray(body.articles)) {
    return NextResponse.json(
      { error: "Articles payload must be an array." },
      { status: 400 }
    );
  }

  const prepared = prepareHomepageArticles(
    body.articles as NewsAnalysisRequestArticle[],
    MAX_DISPLAY_ARTICLES
  );

  if (prepared.length === 0) {
    return NextResponse.json({ analysisByUrl: {} });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    await ensureSettingsIndexes(db);

    const analysisByUrl = await analyzeHomepageArticles(db, prepared);
    return NextResponse.json({ analysisByUrl });
  } catch (error) {
    console.error("Failed to analyze homepage news.", error);
    return NextResponse.json(
      { error: "Failed to analyze homepage news." },
      { status: 500 }
    );
  }
}
