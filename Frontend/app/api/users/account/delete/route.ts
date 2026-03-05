import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { hasRecentReauth } from "@/lib/server/reauth";
import { getClientIp } from "@/lib/server/request-context";
import { revokeOtherSessions } from "@/lib/server/sessions";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

const DELETION_RETENTION_DAYS = 30;

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    key: `delete:${context.userId}:${ip}`,
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many deletion requests. Please try again later." },
      { status: 429 }
    );
  }

  if (!hasRecentReauth(context.user)) {
    return NextResponse.json(
      { error: "Please re-authenticate before requesting account deletion." },
      { status: 403 }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const confirmText = typeof payload.confirmText === "string" ? payload.confirmText : "";
  if (confirmText !== "DELETE") {
    return NextResponse.json(
      { error: 'Please type "DELETE" to confirm account deletion.' },
      { status: 400 }
    );
  }

  const now = new Date();
  const scheduledDeletionAt = new Date(
    now.getTime() + DELETION_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  await context.db.collection("users").updateOne(context.query, {
    $set: {
      "privacy.deletionRequestedAt": now,
      "privacy.scheduledDeletionAt": scheduledDeletionAt,
      updatedAt: now,
    },
  });

  await revokeOtherSessions(context.db, context.userId, context.currentSessionId);

  await context.db.collection("privacy_jobs").insertOne({
    jobId: randomUUID(),
    userId: context.userId,
    type: "delete",
    status: "pending",
    requestedAt: now,
    scheduledDeletionAt,
    createdAt: now,
    updatedAt: now,
    reason: typeof payload.reason === "string" ? payload.reason.trim() : null,
  });

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "privacy.deletion_requested",
    metadata: {
      scheduledDeletionAt: scheduledDeletionAt.toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    scheduledDeletionAt: scheduledDeletionAt.toISOString(),
  });
}
