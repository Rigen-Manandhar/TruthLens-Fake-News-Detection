export async function POST(req: Request) {
  try {
    const json = await req.json();

    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
    const r = await fetch(`${backend}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
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
    return new Response(JSON.stringify({ detail: "Backend connection failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
