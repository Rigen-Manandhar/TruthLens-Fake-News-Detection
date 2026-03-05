import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  EXPORT_URL_TTL_MS,
  buildExportDownloadUrl,
  buildUserExportPayload,
  createJobId,
} from "@/lib/server/privacy";
import { checkRateLimit } from "@/lib/server/rate-limit";
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
    key: `export:${context.userId}:${ip}`,
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many export requests. Please try again later." },
      { status: 429 }
    );
  }

  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const format = typeof payload.format === "string" ? payload.format : "json";
  if (format !== "json") {
    return NextResponse.json({ error: "Only JSON export is supported." }, { status: 400 });
  }

  const jobId = createJobId();
  const now = new Date();
  const downloadExpiresAt = new Date(now.getTime() + EXPORT_URL_TTL_MS);
  const downloadUrl = buildExportDownloadUrl(jobId, context.userId, downloadExpiresAt);

  await context.db.collection("privacy_jobs").insertOne({
    jobId,
    userId: context.userId,
    type: "export",
    status: "processing",
    format,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const exportPayload = await buildUserExportPayload(context.db, context.user);
    await context.db.collection("privacy_jobs").updateOne(
      { jobId, userId: context.userId },
      {
        $set: {
          status: "completed",
          payload: exportPayload,
          completedAt: new Date(),
          updatedAt: new Date(),
          downloadExpiresAt,
          downloadUrl,
        },
      }
    );
  } catch (error) {
    await context.db.collection("privacy_jobs").updateOne(
      { jobId, userId: context.userId },
      {
        $set: {
          status: "failed",
          updatedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Export failed",
        },
      }
    );

    return NextResponse.json({ error: "Failed to prepare export." }, { status: 500 });
  }

  await logAuditEvent(context.db, {
    userId: context.userId,
    eventType: "privacy.export_requested",
    metadata: { jobId, format },
  });

  return NextResponse.json({ jobId, status: "completed" });
}
