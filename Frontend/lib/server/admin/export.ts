import { createHmac, timingSafeEqual } from "crypto";
import type { Db } from "mongodb";
import type {
  AdminExportFeedback,
  AdminExportPayload,
  AdminExportUser,
} from "@/lib/shared/admin";
import { EXPORT_URL_TTL_MS, createJobId } from "@/lib/server/privacy";
import { normalizeUserRole } from "@/lib/server/user-role";
import { buildAdminDashboardPayload } from "./dashboard";
import { toIso } from "./utils";

export const ADMIN_EXPORT_TYPE = "admin_export";

const EXPORT_SIGNING_SECRET = (() => {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for admin export signing.");
  }
  return secret;
})();

export async function buildAdminExportPayload(db: Db): Promise<AdminExportPayload> {
  const summary = await buildAdminDashboardPayload(db);
  const usersRaw = await db
    .collection("users")
    .find({ "privacy.deletedAt": null })
    .sort({ createdAt: -1 })
    .toArray();
  const feedbackRaw = await db
    .collection("prediction_feedback")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const userMap = new Map<string, Record<string, unknown>>(
    usersRaw.map((user) => [String(user._id), user as Record<string, unknown>])
  );

  const users: AdminExportUser[] = usersRaw.map((user) => ({
    id: String(user._id),
    name:
      typeof user.name === "string" && user.name.trim()
        ? user.name
        : typeof user.fullName === "string" && user.fullName.trim()
          ? user.fullName
          : "Unnamed user",
    email: typeof user.email === "string" ? user.email : "",
    role: normalizeUserRole(user.role),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  }));

  const feedback: AdminExportFeedback[] = feedbackRaw.map((entry) => {
    const userId = typeof entry.userId === "string" ? entry.userId : "";
    const user = userMap.get(userId);
    const prediction =
      entry.prediction && typeof entry.prediction === "object"
        ? (entry.prediction as Record<string, unknown>)
        : {};
    const input =
      entry.input && typeof entry.input === "object"
        ? (entry.input as Record<string, unknown>)
        : {};
    const feedbackValue =
      entry.feedback && typeof entry.feedback === "object"
        ? (entry.feedback as Record<string, unknown>)
        : {};

    return {
      id: String(entry._id),
      userId,
      userName:
        user && typeof user.name === "string" && user.name.trim()
          ? user.name
          : user && typeof user.fullName === "string" && user.fullName.trim()
            ? user.fullName
            : "Unknown user",
      userEmail:
        user && typeof user.email === "string" ? user.email : "Unknown email",
      source: typeof entry.source === "string" ? entry.source : "unknown",
      input: {
        text: typeof input.text === "string" ? input.text : "",
        url: typeof input.url === "string" ? input.url : "",
        inputMode: typeof input.inputMode === "string" ? input.inputMode : "unknown",
      },
      prediction: {
        verdict: typeof prediction.verdict === "string" ? prediction.verdict : "UNKNOWN",
        riskLevel:
          typeof prediction.riskLevel === "string"
            ? prediction.riskLevel
            : "Needs Review",
        finalScore:
          typeof prediction.finalScore === "number" ? prediction.finalScore : null,
      },
      feedback: {
        isCorrect: feedbackValue.isCorrect === true,
        comment: typeof feedbackValue.comment === "string" ? feedbackValue.comment : "",
      },
      createdAt: toIso(entry.createdAt),
      updatedAt: toIso(entry.updatedAt),
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    summary,
    users,
    feedback,
  };
}

export function buildAdminExportDownloadUrl(jobId: string, userId: string, expiresAt: Date) {
  const expiresAtMs = expiresAt.getTime();
  const sig = createHmac("sha256", EXPORT_SIGNING_SECRET)
    .update(`${jobId}:${userId}:${expiresAtMs}:${ADMIN_EXPORT_TYPE}`)
    .digest("hex");

  const params = new URLSearchParams({
    download: "1",
    exp: String(expiresAtMs),
    sig,
  });

  return `/api/admin/export/${jobId}?${params.toString()}`;
}

export function verifyAdminExportDownloadUrlSignature(input: {
  jobId: string;
  userId: string;
  expiresAtMs: number;
  signature: string;
}) {
  const expected = createHmac("sha256", EXPORT_SIGNING_SECRET)
    .update(`${input.jobId}:${input.userId}:${input.expiresAtMs}:${ADMIN_EXPORT_TYPE}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(input.signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export {
  EXPORT_URL_TTL_MS,
  createJobId,
};
