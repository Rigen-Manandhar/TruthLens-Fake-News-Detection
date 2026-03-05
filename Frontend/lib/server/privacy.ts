import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { Db } from "mongodb";
import { normalizePreferences } from "@/lib/shared/settings";

export type PrivacyJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export const EXPORT_URL_TTL_MS = 24 * 60 * 60 * 1000;
const EXPORT_SIGNING_SECRET = (() => {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for privacy export signing.");
  }
  return secret;
})();

const toIso = (value: unknown): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
};

export async function buildUserExportPayload(db: Db, user: Record<string, unknown>) {
  const userId = String(user._id);
  const auditEvents = await db
    .collection("audit_events")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const sessions = await db
    .collection("user_sessions")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const privacy =
    user.privacy && typeof user.privacy === "object"
      ? (user.privacy as Record<string, unknown>)
      : {};
  const security =
    user.security && typeof user.security === "object"
      ? (user.security as Record<string, unknown>)
      : {};

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: userId,
      name: (user.name as string) ?? (user.fullName as string) ?? "",
      email: (user.email as string) ?? "",
      image: (user.image as string | null) ?? null,
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    },
    preferences: normalizePreferences(user.preferences),
    security: {
      hasPassword: Boolean(user.passwordHash),
      lastPasswordChangedAt: toIso(security.lastPasswordChangedAt),
      reauthUntil: toIso(security.reauthUntil),
    },
    privacy: {
      deletionRequestedAt: toIso(privacy.deletionRequestedAt),
      scheduledDeletionAt: toIso(privacy.scheduledDeletionAt),
      deletedAt: toIso(privacy.deletedAt),
    },
    activeArtifacts: {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        createdAt: toIso(session.createdAt),
        lastSeenAt: toIso(session.lastSeenAt),
        isRevoked: Boolean(session.isRevoked),
        deviceLabel: session.deviceLabel ?? null,
        ipPreview: session.ipPreview ?? null,
      })),
      auditEvents: auditEvents.map((event) => ({
        eventType: event.eventType,
        actor: event.actor ?? null,
        target: event.target ?? null,
        metadata: event.metadata ?? {},
        createdAt: toIso(event.createdAt),
      })),
    },
  };
}

export function createJobId() {
  return randomUUID();
}

const createExportSignature = (jobId: string, userId: string, expiresAtMs: number) => {
  return createHmac("sha256", EXPORT_SIGNING_SECRET)
    .update(`${jobId}:${userId}:${expiresAtMs}`)
    .digest("hex");
};

export function buildExportDownloadUrl(jobId: string, userId: string, expiresAt: Date) {
  const expires = expiresAt.getTime();
  const sig = createExportSignature(jobId, userId, expires);
  const params = new URLSearchParams({
    download: "1",
    exp: String(expires),
    sig,
  });

  return `/api/users/export/${jobId}?${params.toString()}`;
}

export function verifyExportDownloadUrlSignature(input: {
  jobId: string;
  userId: string;
  expiresAtMs: number;
  signature: string;
}) {
  const { jobId, userId, expiresAtMs, signature } = input;
  const expected = createExportSignature(jobId, userId, expiresAtMs);

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
