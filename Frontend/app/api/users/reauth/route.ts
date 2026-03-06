import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { REAUTH_WINDOW_MS, setRecentReauth } from "@/lib/server/reauth";
import { getClientIp } from "@/lib/server/request-context";
import { getProviderInfo, getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

const isFreshSessionForGoogleReauth = async (
  context: NonNullable<Awaited<ReturnType<typeof getUserContext>>>
) => {
  if (!context.currentSessionId) {
    return false;
  }

  const sessionRecord = await context.db.collection("user_sessions").findOne({
    sessionId: context.currentSessionId,
    userId: context.userId,
    isRevoked: { $ne: true },
  });

  if (!sessionRecord) {
    return false;
  }

  const expiresAt =
    sessionRecord.expiresAt instanceof Date
      ? sessionRecord.expiresAt
      : new Date(String(sessionRecord.expiresAt ?? ""));
  const createdAt =
    sessionRecord.createdAt instanceof Date
      ? sessionRecord.createdAt
      : new Date(String(sessionRecord.createdAt ?? ""));

  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  if (expiresAt.getTime() <= Date.now()) {
    return false;
  }

  return Date.now() - createdAt.getTime() <= REAUTH_WINDOW_MS;
};

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

    const hasFreshSession = await isFreshSessionForGoogleReauth(context);
    if (!hasFreshSession) {
      return NextResponse.json(
        {
          error:
            "Google re-auth requires a fresh Google sign-in. Sign out, sign back in with Google, then retry within 10 minutes.",
        },
        { status: 403 }
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
