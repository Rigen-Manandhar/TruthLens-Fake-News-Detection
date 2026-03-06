import { ObjectId, type Db } from "mongodb";
import {
  signExtensionFeedbackToken,
  verifyExtensionFeedbackToken,
} from "@/lib/auth";

type UserDoc = Record<string, unknown>;

const getSecurity = (user: UserDoc): Record<string, unknown> => {
  return user.security && typeof user.security === "object"
    ? (user.security as Record<string, unknown>)
    : {};
};

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return email ? email : null;
};

export const getExtensionTokenVersion = (user: UserDoc): number => {
  const security = getSecurity(user);
  return typeof security.extensionTokenVersion === "number"
    ? security.extensionTokenVersion
    : 1;
};

export const getExtensionTokenRotatedAt = (user: UserDoc): Date | null => {
  const security = getSecurity(user);
  const value = security.extensionTokenRotatedAt;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export const createExtensionFeedbackToken = (user: UserDoc): string => {
  const userId = typeof user._id?.toString === "function" ? user._id.toString() : "";
  const email = normalizeEmail(user.email);

  if (!userId || !email) {
    throw new Error("Cannot issue extension token for user without id/email.");
  }

  return signExtensionFeedbackToken({
    sub: userId,
    email,
    version: getExtensionTokenVersion(user),
  });
};

export async function getUserFromExtensionFeedbackToken(db: Db, token: string) {
  const payload = verifyExtensionFeedbackToken(token);
  if (!payload) {
    return null;
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(payload.sub);
  } catch {
    return null;
  }

  const user = (await db.collection("users").findOne({
    _id: objectId,
  })) as UserDoc | null;

  if (!user) {
    return null;
  }

  const email = normalizeEmail(user.email);
  if (!email || email !== payload.email.toLowerCase()) {
    return null;
  }

  if (getExtensionTokenVersion(user) !== payload.version) {
    return null;
  }

  return {
    user,
    userId: payload.sub,
    version: payload.version,
  };
}
