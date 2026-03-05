import type { Db } from "mongodb";

type AuditInput = {
  userId: string;
  eventType: string;
  actor?: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(db: Db, input: AuditInput) {
  const {
    userId,
    eventType,
    actor = "user",
    target = "self",
    metadata = {},
  } = input;

  await db.collection("audit_events").insertOne({
    userId,
    eventType,
    actor,
    target,
    metadata,
    createdAt: new Date(),
  });
}

