import { NextResponse } from "next/server";
import { ensureSettingsIndexes } from "@/lib/server/db";
import {
  buildExportDownloadUrl,
  verifyExportDownloadUrlSignature,
} from "@/lib/server/privacy";
import { getUserContext } from "@/lib/server/user-context";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  contextParams: { params: Promise<{ jobId: string }> }
) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSettingsIndexes(context.db);

  const { jobId } = await contextParams.params;
  if (!jobId) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const job = await context.db.collection("privacy_jobs").findOne({
    jobId,
    userId: context.userId,
    type: "export",
  });

  if (!job) {
    return NextResponse.json({ error: "Export job not found." }, { status: 404 });
  }

  const status = typeof job.status === "string" ? job.status : "pending";
  const expiresAt = job.downloadExpiresAt instanceof Date
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

    const validSignature = verifyExportDownloadUrlSignature({
      jobId,
      userId: context.userId,
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
        "Content-Disposition": `attachment; filename="truthlens-export-${jobId}.json"`,
      },
    });
  }

  const downloadUrl =
    status === "completed" && job.downloadExpiresAt instanceof Date
      ? buildExportDownloadUrl(jobId, context.userId, job.downloadExpiresAt)
      : null;

  return NextResponse.json({
    jobId,
    status,
    downloadUrl,
    expiresAt,
  });
}
