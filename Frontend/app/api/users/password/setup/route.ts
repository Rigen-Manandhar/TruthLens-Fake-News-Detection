import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { validatePasswordStrength } from "@/lib/server/password-policy";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { hasRecentReauth } from "@/lib/server/reauth";
import { getClientIp } from "@/lib/server/request-context";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `password-setup:${context.userId}:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!hasRecentReauth(context.user)) {
    return NextResponse.json(
      { error: "Please re-authenticate before setting a password." },
      { status: 403 }
    );
  }

  if (typeof context.user.passwordHash === "string" && context.user.passwordHash) {
    return NextResponse.json(
      { error: "Password already exists for this account." },
      { status: 400 }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await context.db.collection("users").updateOne(context.query, {
    $set: {
      passwordHash,
      "security.hasPassword": true,
      "security.lastPasswordChangedAt": new Date(),
      updatedAt: new Date(),
    },
  });

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "password.setup",
    metadata: { ip },
  });

  return NextResponse.json({ ok: true });
}
