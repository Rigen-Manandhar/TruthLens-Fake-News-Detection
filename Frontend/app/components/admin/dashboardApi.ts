import type { AdminDashboardResponse, AdminExportJob } from "@/lib/shared/admin";

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

export async function fetchAdminExportJob(jobId: string) {
  const response = await fetch(`/api/admin/export/${jobId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load export status.");
  }

  return (await response.json()) as AdminExportJob;
}

export async function requestAdminExport() {
  const response = await fetch("/api/admin/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await response.json().catch(() => null)) as
    | { jobId?: string; status?: string; error?: string }
    | null;

  if (!response.ok || !data?.jobId) {
    throw new Error(data?.error ?? "Failed to request export.");
  }

  return data.jobId;
}
