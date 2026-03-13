import crypto from "crypto";
import type { Db } from "mongodb";

export const PASSWORD_RESET_COLLECTION = "password_reset_tokens";
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export type PasswordResetPurpose = "password_reset";

export type PasswordResetRecord = {
  userId: string;
  email: string;
  tokenHash: string;
  purpose: PasswordResetPurpose;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  requestedIp: string;
};

export function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();

  return {
    rawToken,
    tokenHash: hashPasswordResetToken(rawToken),
    expiresAt: new Date(now + PASSWORD_RESET_TTL_MS),
  };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetCollection(db: Db) {
  return db.collection<PasswordResetRecord>(PASSWORD_RESET_COLLECTION);
}
