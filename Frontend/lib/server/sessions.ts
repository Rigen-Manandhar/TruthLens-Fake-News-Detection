import crypto from "crypto";
import type { Db } from "mongodb";
import { getClientIp, getDeviceLabel, hashIp, maskIp } from "./request-context";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export function normalizeSessionId(sessionId: string | null): string {
  return sessionId && sessionId.trim() ? sessionId : crypto.randomUUID();
}

export async function touchUserSession(input: {
  db: Db;
  req: Request;
  userId: string;
  sessionId: string;
  sessionVersion: number;
}) {
  const { db, req, userId, sessionId, sessionVersion } = input;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const ip = getClientIp(req);

  await db.collection("user_sessions").updateOne(
    { sessionId },
    {
      $set: {
        userId,
        sessionId,
        lastSeenAt: now,
        expiresAt,
        deviceLabel: getDeviceLabel(req),
        userAgent: req.headers.get("user-agent") ?? "",
        ipHash: hashIp(ip),
        ipPreview: maskIp(ip),
        sessionVersionAtIssue: sessionVersion,
        isRevoked: false,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

export async function listUserSessions(db: Db, userId: string, currentSessionId: string | null) {
  const now = new Date();
  const sessions = await db
    .collection("user_sessions")
    .find({
      userId,
      isRevoked: { $ne: true },
      expiresAt: { $gt: now },
    })
    .sort({ lastSeenAt: -1 })
    .toArray();

  return sessions.map((session) => ({
    sessionId: String(session.sessionId),
    deviceLabel:
      typeof session.deviceLabel === "string" ? session.deviceLabel : "Unknown device",
    ipPreview: typeof session.ipPreview === "string" ? session.ipPreview : "***.***.***.***",
    createdAt: toDate(session.createdAt)?.toISOString() ?? now.toISOString(),
    lastSeenAt: toDate(session.lastSeenAt)?.toISOString() ?? now.toISOString(),
    isCurrent: String(session.sessionId) === currentSessionId,
  }));
}

export async function revokeSession(db: Db, userId: string, sessionId: string) {
  const result = await db.collection("user_sessions").updateOne(
    { userId, sessionId },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

export async function revokeOtherSessions(
  db: Db,
  userId: string,
  currentSessionId: string | null
) {
  const filter: Record<string, unknown> = { userId, isRevoked: { $ne: true } };
  if (currentSessionId) {
    filter.sessionId = { $ne: currentSessionId };
  }

  const result = await db.collection("user_sessions").updateMany(filter, {
    $set: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  return result.modifiedCount;
}

