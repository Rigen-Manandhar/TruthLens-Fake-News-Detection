import type { AdminDashboardResponse } from "@/lib/shared/admin";

export async function fetchAdminDashboard() {
  const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
  const data = (await response.json().catch(() => null)) as
    | (AdminDashboardResponse & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to load admin dashboard.");
  }

  return data as AdminDashboardResponse;
}
