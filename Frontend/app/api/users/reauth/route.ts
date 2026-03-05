import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { REAUTH_WINDOW_MS, setRecentReauth } from "@/lib/server/reauth";
import { getClientIp } from "@/lib/server/request-context";
import { getProviderInfo, getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `reauth:${context.userId}:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const method = typeof payload.method === "string" ? payload.method : "password";

  if (method === "password") {
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (typeof context.user.passwordHash !== "string" || !context.user.passwordHash) {
      return NextResponse.json(
        { error: "Password re-auth is unavailable for this account." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(password, context.user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 401 });
    }
  } else if (method === "google") {
    const providerInfo = await getProviderInfo(context.db, context.userId);
    if (!providerInfo.hasGoogle) {
      return NextResponse.json(
        { error: "Google re-auth is unavailable for this account." },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json({ error: "Unsupported re-auth method." }, { status: 400 });
  }

  const reauthUntil = new Date(Date.now() + REAUTH_WINDOW_MS);
  await setRecentReauth(context.db, context.query, reauthUntil);

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "security.reauth",
    metadata: { method, ip },
  });

  return NextResponse.json({ ok: true, reauthUntil: reauthUntil.toISOString() });
}

