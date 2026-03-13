import type { Db } from "mongodb";

let ensured = false;

export async function ensureSettingsIndexes(db: Db) {
  if (ensured) {
    return;
  }

  await db.collection("user_sessions").createIndex({ sessionId: 1 }, { unique: true });
  await db.collection("user_sessions").createIndex({ userId: 1, isRevoked: 1, expiresAt: -1 });
  await db.collection("user_sessions").createIndex({ expiresAt: 1 });

  await db.collection("privacy_jobs").createIndex({ jobId: 1 }, { unique: true });
  await db.collection("privacy_jobs").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("privacy_jobs").createIndex({ downloadExpiresAt: 1 });

  await db.collection("audit_events").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("audit_events").createIndex({ eventType: 1, createdAt: -1 });

  await db.collection("prediction_feedback").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("prediction_feedback").createIndex({ source: 1, createdAt: -1 });

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection("password_reset_tokens").createIndex({ userId: 1, usedAt: 1 });
  await db
    .collection("password_reset_tokens")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  ensured = true;
}
