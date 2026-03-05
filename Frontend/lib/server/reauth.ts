import type { Db, Filter } from "mongodb";

export const REAUTH_WINDOW_MS = 10 * 60 * 1000;

type UserDoc = Record<string, unknown>;

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

export function getReauthUntil(user: UserDoc): Date | null {
  const security =
    user.security && typeof user.security === "object"
      ? (user.security as Record<string, unknown>)
      : {};

  return toDate(security.reauthUntil);
}

export function hasRecentReauth(user: UserDoc): boolean {
  const reauthUntil = getReauthUntil(user);
  if (!reauthUntil) {
    return false;
  }

  return reauthUntil.getTime() > Date.now();
}

export async function setRecentReauth(
  db: Db,
  query: Filter<Record<string, unknown>>,
  reauthUntil: Date
) {
  await db.collection("users").updateOne(query, {
    $set: {
      "security.reauthUntil": reauthUntil,
      updatedAt: new Date(),
    },
  });
}

