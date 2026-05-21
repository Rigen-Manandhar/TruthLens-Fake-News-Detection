import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

    const backendForm = new FormData();
    backendForm.append("file", file);

    const r = await fetch(`${backend}/deepfake/predict`, {
      method: "POST",
      body: backendForm,
      cache: "no-store",
    });

    const body = await r.text();

    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ detail: "Backend connection failed" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
