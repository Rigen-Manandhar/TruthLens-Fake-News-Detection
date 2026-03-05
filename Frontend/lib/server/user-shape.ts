import type { Db } from "mongodb";
import { normalizePreferences } from "@/lib/shared/settings";
import { getProviderInfo } from "./user-context";
import { getReauthUntil } from "./reauth";

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

export async function buildUserSummary(db: Db, user: Record<string, unknown>) {
  const userId = String(user._id);
  const providerInfo = await getProviderInfo(db, userId);
  const preferences = normalizePreferences(user.preferences);
  const reauthUntil = getReauthUntil(user);

  const hasPassword = Boolean(user.passwordHash);
  const sessionCount = await db.collection("user_sessions").countDocuments({
    userId,
    isRevoked: { $ne: true },
    expiresAt: { $gt: new Date() },
  });

  const privacy =
    user.privacy && typeof user.privacy === "object"
      ? (user.privacy as Record<string, unknown>)
      : {};

  const security =
    user.security && typeof user.security === "object"
      ? (user.security as Record<string, unknown>)
      : {};

  return {
    id: userId,
    name: (user.name as string) ?? (user.fullName as string) ?? "",
    email: (user.email as string) ?? "",
    image: (user.image as string | null) ?? null,
    hasPassword,
    providerInfo: {
      providers: providerInfo.providers,
      googleConnected: providerInfo.hasGoogle,
      passwordLogin: hasPassword,
    },
    preferences,
    securitySummary: {
      reauthUntil: reauthUntil?.toISOString() ?? null,
      reauthRequired: !reauthUntil || reauthUntil.getTime() <= Date.now(),
      lastPasswordChangedAt: toIso(security.lastPasswordChangedAt),
      sessionCount,
      sessionVersion:
        typeof security.sessionVersion === "number" ? security.sessionVersion : 1,
    },
    deletionStatus: {
      deletionRequestedAt: toIso(privacy.deletionRequestedAt),
      scheduledDeletionAt: toIso(privacy.scheduledDeletionAt),
      deletedAt: toIso(privacy.deletedAt),
    },
  };
}

