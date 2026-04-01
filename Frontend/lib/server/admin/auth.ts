import type { UserContext } from "@/lib/server/user-context";
import { getUserContext } from "@/lib/server/user-context";
import { normalizeUserRole } from "@/lib/server/user-role";

export type AdminAuthResult =
  | { kind: "unauthorized" }
  | { kind: "forbidden"; context: UserContext }
  | { kind: "authorized"; context: UserContext };

export async function getAdminAuthResult(req: Request): Promise<AdminAuthResult> {
  const context = await getUserContext(req);
  if (!context) {
    return { kind: "unauthorized" };
  }

  if (normalizeUserRole(context.user.role) !== "admin") {
    return { kind: "forbidden", context };
  }

  return { kind: "authorized", context };
}
