import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb-client";
import { normalizeUserRole } from "@/lib/server/user-role";

export function createCredentialsProvider() {
  return CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const client = await clientPromise;
      const db = client.db();
      const user = await db
        .collection("users")
        .findOne({ email: normalizedEmail });

      if (!user || !user.passwordHash) {
        return null;
      }

      const privacy =
        user.privacy && typeof user.privacy === "object"
          ? (user.privacy as Record<string, unknown>)
          : {};
      if (privacy.deletionRequestedAt || privacy.deletedAt) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return null;
      }

      return {
        id: user._id.toString(),
        name: user.name ?? user.fullName ?? user.email,
        email: user.email,
        role: normalizeUserRole(user.role),
      };
    },
  });
}
