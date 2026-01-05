export async function POST(req: Request) {
  try {
    const text = await req.text();

    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
    const r = await fetch(`${backend}/predict-text`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
      cache: "no-store",
    });

    const body = await r.text();

    return new Response(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify("Backend connection failed"), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
