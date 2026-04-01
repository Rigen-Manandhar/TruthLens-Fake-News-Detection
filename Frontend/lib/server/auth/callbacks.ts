import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import type { NextAuthOptions } from "next-auth";
import clientPromise from "@/lib/mongodb-client";
import {
  normalizeUserRole,
  seedAdminRoleIfEligible,
} from "@/lib/server/user-role";

type AuthCallbacks = NonNullable<NextAuthOptions["callbacks"]>;

export const authCallbacks: AuthCallbacks = {
  async signIn({ user }) {
    try {
      const client = await clientPromise;
      const db = client.db();
      let dbUser: Record<string, unknown> | null = null;

      if (user.id) {
        dbUser = (await db
          .collection("users")
          .findOne({ _id: new ObjectId(String(user.id)) })) as Record<string, unknown> | null;
      }

      if (!dbUser && user.email) {
        dbUser = (await db
          .collection("users")
          .findOne({ email: String(user.email).toLowerCase() })) as Record<string, unknown> | null;
      }

      const privacy =
        dbUser?.privacy && typeof dbUser.privacy === "object"
          ? (dbUser.privacy as Record<string, unknown>)
          : {};

      if (privacy.deletionRequestedAt || privacy.deletedAt) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  },
  async jwt({ token, user }) {
    if (user?.id) {
      token.id = user.id;
    }
    if (!token.id && token.sub) {
      token.id = token.sub;
    }
    if (user?.name) {
      token.name = user.name;
    }
    if (user?.email) {
      token.email = user.email;
    }
    if (user?.image) {
      token.picture = user.image;
    }
    if (typeof token.sessionId !== "string" || !token.sessionId) {
      token.sessionId = randomUUID();
    }
    token.role = normalizeUserRole(token.role);
    token.blocked = false;

    try {
      if (token.id) {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = (await db
          .collection("users")
          .findOne({ _id: new ObjectId(String(token.id)) })) as Record<string, unknown> | null;

        if (!dbUser) {
          token.blocked = true;
          return token;
        }

        token.role = await seedAdminRoleIfEligible(db, dbUser);

        const privacy =
          dbUser.privacy && typeof dbUser.privacy === "object"
            ? (dbUser.privacy as Record<string, unknown>)
            : {};
        if (privacy.deletionRequestedAt || privacy.deletedAt) {
          token.blocked = true;
          return token;
        }

        const security =
          dbUser.security && typeof dbUser.security === "object"
            ? (dbUser.security as Record<string, unknown>)
            : {};
        const dbSessionVersion =
          typeof security.sessionVersion === "number" ? security.sessionVersion : 1;
        token.sessionVersion = dbSessionVersion;

        if (
          typeof token.tokenVersion === "number" &&
          token.tokenVersion < dbSessionVersion
        ) {
          token.blocked = true;
          return token;
        }

        token.tokenVersion = dbSessionVersion;

        if (typeof token.sessionId === "string") {
          const sessionRecord = (await db.collection("user_sessions").findOne({
            sessionId: token.sessionId,
          })) as Record<string, unknown> | null;

          if (sessionRecord) {
            const revoked = Boolean(sessionRecord.isRevoked);
            const sessionUserId = String(sessionRecord.userId ?? "");
            const expiresAt =
              sessionRecord.expiresAt instanceof Date
                ? sessionRecord.expiresAt.getTime()
                : 0;
            if (
              revoked ||
              sessionUserId !== String(token.id) ||
              (expiresAt > 0 && expiresAt <= Date.now())
            ) {
              token.blocked = true;
              return token;
            }
          }
        }
      }
    } catch {
      token.blocked = true;
    }

    return token;
  },
  async session({ session, token }) {
    if (token?.blocked) {
      return {
        ...session,
        user: undefined,
      };
    }

    if (token?.id && session.user) {
      (session.user as { id?: string }).id = String(token.id);
    }
    if (session.user) {
      (session.user as { role?: "user" | "admin" }).role = normalizeUserRole(token.role);
    }
    if (session.user && typeof token.sessionId === "string") {
      (session.user as { sessionId?: string }).sessionId = token.sessionId;
    }

    try {
      if (token?.id && session.user) {
        const client = await clientPromise;
        const db = client.db();
        const user = await db
          .collection("users")
          .findOne({ _id: new ObjectId(String(token.id)) });

        if (user) {
          session.user.name = user.name ?? user.fullName ?? session.user.name ?? "";
          session.user.email = user.email ?? session.user.email ?? "";
          session.user.image = user.image ?? session.user.image ?? null;
          (session.user as { role?: "user" | "admin" }).role = normalizeUserRole(user.role);
        }
      }
    } catch {
      // Keep session as-is if lookup fails.
    }

    return session;
  },
};
