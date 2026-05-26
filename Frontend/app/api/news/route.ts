import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "us";
  const category = searchParams.get("category") || "";
  const pageSize = searchParams.get("pageSize") || "20";
  const query = searchParams.get("q") || "";
  const apiKey = process.env.NEWS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "NEWS_API_KEY is not configured." },
      { status: 503 }
    );
  }

  try {
    const newsParams = new URLSearchParams({
      country,
      pageSize,
      apiKey,
    });

    if (category) {
      newsParams.set("category", category);
    }

    if (query) {
      newsParams.set("q", query);
    }

    const url = `https://newsapi.org/v2/top-headlines?${newsParams.toString()}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      return NextResponse.json(
        { error: errorData?.message || "Failed to fetch news" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}
