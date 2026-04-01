import type { AccountProfile, ExportJob } from "./types";
import { parseError } from "./utils";
import type { UserPreferences } from "@/lib/shared/settings";

export async function updateProfileName(name: string) {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to update profile."));
  }

  return (await res.json()) as { user: AccountProfile };
}

export async function updatePreferences(prefs: UserPreferences) {
  const res = await fetch("/api/users/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to save preferences."));
  }

  return (await res.json()) as { user: AccountProfile };
}

export async function reauthenticateUser(input: {
  method: "password" | "google";
  password?: string;
}) {
  const res = await fetch("/api/users/reauth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Re-auth failed."));
  }
}

export async function updatePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const res = await fetch("/api/users/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to update password."));
  }
}

export async function setupPassword(newPassword: string) {
  const res = await fetch("/api/users/password/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to set password."));
  }
}

export async function revokeSessionById(sessionId: string) {
  const res = await fetch(`/api/users/sessions/${sessionId}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to revoke session."));
  }
}

export async function revokeOtherSessions() {
  const res = await fetch("/api/users/sessions/revoke-others", { method: "POST" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to revoke sessions."));
  }
}

export async function requestUserExport() {
  const res = await fetch("/api/users/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "json" }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to request export."));
  }

  return (await res.json()) as {
    jobId: string;
    status: ExportJob["status"];
  };
}

export async function requestAccountDeletion(input: {
  confirmText: string;
  reason: string;
}) {
  const res = await fetch("/api/users/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to request deletion."));
  }
}

export async function cancelAccountDeletion() {
  const res = await fetch("/api/users/account/cancel-delete", { method: "POST" });
  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to cancel deletion."));
  }
}
