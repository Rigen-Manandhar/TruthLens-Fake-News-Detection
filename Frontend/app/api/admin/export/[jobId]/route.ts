import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  ADMIN_EXPORT_TYPE,
  buildAdminExportDownloadUrl,
  verifyAdminExportDownloadUrlSignature,
} from "@/lib/server/admin/export";
import { getAdminAuthResult } from "@/lib/server/admin/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  contextParams: { params: Promise<{ jobId: string }> }
) {
  const auth = await getAdminAuthResult(req);
  if (auth.kind === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureSettingsIndexes(auth.context.db);

  const { jobId } = await contextParams.params;
  if (!jobId) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const job = await auth.context.db.collection("privacy_jobs").findOne({
    jobId,
    userId: auth.context.userId,
    type: ADMIN_EXPORT_TYPE,
  });

  if (!job) {
    return NextResponse.json({ error: "Export job not found." }, { status: 404 });
  }

  const status = typeof job.status === "string" ? job.status : "pending";
  const expiresAt =
    job.downloadExpiresAt instanceof Date
      ? job.downloadExpiresAt.toISOString()
      : null;

  const url = new URL(req.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  if (shouldDownload) {
    if (status !== "completed" || !job.payload) {
      return NextResponse.json({ error: "Export is not ready." }, { status: 409 });
    }

    if (job.downloadExpiresAt instanceof Date && job.downloadExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Export has expired." }, { status: 410 });
    }

    const signature = url.searchParams.get("sig");
    const expParam = Number(url.searchParams.get("exp"));
    const expiresAtMs =
      job.downloadExpiresAt instanceof Date ? job.downloadExpiresAt.getTime() : NaN;

    if (!signature || !Number.isFinite(expParam) || expParam !== expiresAtMs) {
      return NextResponse.json({ error: "Invalid download link." }, { status: 403 });
    }

    const validSignature = verifyAdminExportDownloadUrlSignature({
      jobId,
      userId: auth.context.userId,
      expiresAtMs,
      signature,
    });

    if (!validSignature) {
      return NextResponse.json({ error: "Invalid download link." }, { status: 403 });
    }

    return new Response(JSON.stringify(job.payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="truthlens-admin-export-${jobId}.json"`,
      },
    });
  }

  const downloadUrl =
    status === "completed" && job.downloadExpiresAt instanceof Date
      ? buildAdminExportDownloadUrl(jobId, auth.context.userId, job.downloadExpiresAt)
      : null;

  return NextResponse.json({
    jobId,
    status,
    downloadUrl,
    expiresAt,
  });
}
