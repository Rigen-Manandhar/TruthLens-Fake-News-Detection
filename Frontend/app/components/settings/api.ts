import type { AccountProfile, ExportJob, SessionItem } from "./types";
import { parseError } from "./utils";

export async function fetchProfile() {
  const res = await fetch("/api/users/me", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to load profile."));
  }

  const data = (await res.json()) as { user: AccountProfile };
  return data.user;
}

export async function fetchSessions() {
  const res = await fetch("/api/users/sessions", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to load sessions."));
  }

  const data = (await res.json()) as { sessions: SessionItem[] };
  return data.sessions ?? [];
}

export async function fetchExportJob(jobId: string) {
  const res = await fetch(`/api/users/export/${jobId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to load export status."));
  }

  return (await res.json()) as ExportJob;
}
