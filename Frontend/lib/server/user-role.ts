import type { Db } from "mongodb";
import type { UserRole } from "@/lib/shared/admin";

export const SEEDED_ADMIN_EMAIL = "rigenmanandharrm@gmail.com";

export function normalizeUserRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

export async function seedAdminRoleIfEligible(
  db: Db,
  user: Record<string, unknown> | null
): Promise<UserRole> {
  if (!user) {
    return "user";
  }

  const email =
    typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  const currentRole = normalizeUserRole(user.role);

  if (email !== SEEDED_ADMIN_EMAIL || currentRole === "admin" || !user._id) {
    return currentRole;
  }

  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { role: "admin", updatedAt: new Date() } }
  );
  user.role = "admin";

  return "admin";
}
