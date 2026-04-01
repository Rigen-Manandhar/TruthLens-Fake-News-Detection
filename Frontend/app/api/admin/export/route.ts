import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/server/audit";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  ADMIN_EXPORT_TYPE,
  EXPORT_URL_TTL_MS,
  buildAdminExportDownloadUrl,
  buildAdminExportPayload,
  createJobId,
} from "@/lib/server/admin/export";
import { getAdminAuthResult } from "@/lib/server/admin/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await getAdminAuthResult(req);
  if (auth.kind === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureSettingsIndexes(auth.context.db);

  const jobId = createJobId();
  const now = new Date();
  const downloadExpiresAt = new Date(now.getTime() + EXPORT_URL_TTL_MS);
  const downloadUrl = buildAdminExportDownloadUrl(
    jobId,
    auth.context.userId,
    downloadExpiresAt
  );

  await auth.context.db.collection("privacy_jobs").insertOne({
    jobId,
    userId: auth.context.userId,
    type: ADMIN_EXPORT_TYPE,
    status: "processing",
    format: "json",
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  try {
    const payload = await buildAdminExportPayload(auth.context.db);
    await auth.context.db.collection("privacy_jobs").updateOne(
      { jobId, userId: auth.context.userId, type: ADMIN_EXPORT_TYPE },
      {
        $set: {
          status: "completed",
          payload,
          completedAt: new Date(),
          updatedAt: new Date(),
          downloadExpiresAt,
          downloadUrl,
        },
      }
    );
  } catch (error) {
    await auth.context.db.collection("privacy_jobs").updateOne(
      { jobId, userId: auth.context.userId, type: ADMIN_EXPORT_TYPE },
      {
        $set: {
          status: "failed",
          updatedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Admin export failed",
        },
      }
    );

    return NextResponse.json(
      { error: "Failed to prepare admin export." },
      { status: 500 }
    );
  }

  await logAuditEvent(auth.context.db, {
    userId: auth.context.userId,
    eventType: "admin.export_requested",
    actor: "admin",
    target: "admin.dashboard",
    metadata: { jobId, format: "json" },
  });

  return NextResponse.json({ jobId, status: "completed" });
}
