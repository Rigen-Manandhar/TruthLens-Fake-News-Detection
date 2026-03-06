"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Footer from "../components/Footer";
import ExtensionTokenCard from "../components/settings/ExtensionTokenCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  DEFAULT_USER_PREFERENCES,
  NEWS_CATEGORY_OPTIONS,
  type DetectionExplanationMode,
  type DetectionInputMode,
  type UserPreferences,
} from "@/lib/shared/settings";

type AccountProfile = {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  providerInfo: { providers: string[]; googleConnected: boolean; passwordLogin: boolean };
  preferences: UserPreferences;
  securitySummary: { reauthUntil: string | null; reauthRequired: boolean; sessionCount: number };
  deletionStatus: { deletionRequestedAt: string | null; scheduledDeletionAt: string | null };
};

type SessionItem = {
  sessionId: string;
  deviceLabel: string;
  ipPreview: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

type ExportJob = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl: string | null;
  expiresAt: string | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const parseError = async (res: Response, fallback: string) => {
  const json = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
  return json?.error ?? json?.detail ?? fallback;
};

export default function SettingsPage() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [reauthPassword, setReauthPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [reauthing, setReauthing] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [requestingExport, setRequestingExport] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [cancelingDelete, setCancelingDelete] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/users/me", { cache: "no-store" });
    if (!res.ok) throw new Error(await parseError(res, "Failed to load profile."));
    const data = (await res.json()) as { user: AccountProfile };
    setProfile(data.user);
    setName(data.user.name);
    setPrefs(data.user.preferences ?? DEFAULT_USER_PREFERENCES);
  }, []);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/users/sessions", { cache: "no-store" });
    if (!res.ok) throw new Error(await parseError(res, "Failed to load sessions."));
    const data = (await res.json()) as { sessions: SessionItem[] };
    setSessions(data.sessions ?? []);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([loadProfile(), loadSessions()]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [status, loadProfile, loadSessions]);

  useEffect(() => {
    if (!exportJob || exportJob.status !== "processing") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/users/export/${exportJob.jobId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ExportJob;
      setExportJob(data);
      if (data.status === "completed") toast.success("Export is ready.");
    }, 3000);
    return () => clearInterval(t);
  }, [exportJob]);

  const reauthLabel = useMemo(() => {
    if (!profile) return "Unknown";
    return profile.securitySummary.reauthRequired
      ? "Required for sensitive actions"
      : `Verified until ${formatDate(profile.securitySummary.reauthUntil)}`;
  }, [profile]);

  const providerLabel = useMemo(() => {
    if (!profile) {
      return "";
    }
    if (profile.providerInfo.passwordLogin) {
      return "Password login enabled";
    }
    if (profile.providerInfo.googleConnected) {
      return "Google connected; set a backup password";
    }
    return "No login provider detected";
  }, [profile]);

  const saveProfile = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty.");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to update profile."));
      const data = (await res.json()) as { user: AccountProfile };
      setProfile(data.user); setName(data.user.name); if (update) await update({ name: data.user.name });
      toast.success("Profile updated.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to update profile."); } finally { setSavingProfile(false); }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/users/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to save preferences."));
      const data = (await res.json()) as { user: AccountProfile };
      setProfile(data.user); setPrefs(data.user.preferences); toast.success("Preferences saved.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to save preferences."); } finally { setSavingPrefs(false); }
  };

  const doReauth = async (method: "password" | "google") => {
    setReauthing(true);
    try {
      const body: Record<string, string> = { method };
      if (method === "password") body.password = reauthPassword;
      const res = await fetch("/api/users/reauth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await parseError(res, "Re-auth failed."));
      setReauthPassword(""); await loadProfile(); toast.success("Identity verified.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Re-auth failed."); } finally { setReauthing(false); }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error("Fill all password fields.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/users/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to update password."));
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); await loadProfile(); toast.success("Password updated.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to update password."); } finally { setUpdatingPassword(false); }
  };

  const setupPasswordAction = async () => {
    if (!setupPassword || !setupConfirmPassword) return toast.error("Fill both password fields.");
    if (setupPassword !== setupConfirmPassword) return toast.error("Passwords do not match.");
    setSettingPassword(true);
    try {
      const res = await fetch("/api/users/password/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: setupPassword }) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to set password."));
      setSetupPassword(""); setSetupConfirmPassword(""); await loadProfile(); toast.success("Backup password added.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to set password."); } finally { setSettingPassword(false); }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch(`/api/users/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res, "Failed to revoke session."));
      await loadSessions(); await loadProfile(); toast.success("Session revoked.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to revoke session."); } finally { setRevokingSessionId(null); }
  };

  const revokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const res = await fetch("/api/users/sessions/revoke-others", { method: "POST" });
      if (!res.ok) throw new Error(await parseError(res, "Failed to revoke sessions."));
      await loadSessions(); await loadProfile(); toast.success("Other sessions revoked.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to revoke sessions."); } finally { setRevokingOthers(false); }
  };

  const requestExport = async () => {
    setRequestingExport(true);
    try {
      const res = await fetch("/api/users/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format: "json" }) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to request export."));
      const data = (await res.json()) as { jobId: string; status: "completed" | "processing" };
      const statusRes = await fetch(`/api/users/export/${data.jobId}`, { cache: "no-store" });
      if (statusRes.ok) setExportJob((await statusRes.json()) as ExportJob);
      toast.success("Export requested.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to request export."); } finally { setRequestingExport(false); }
  };

  const requestDeletion = async () => {
    setRequestingDelete(true);
    try {
      const res = await fetch("/api/users/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmText: deleteConfirm, reason: deleteReason }) });
      if (!res.ok) throw new Error(await parseError(res, "Failed to request deletion."));
      setDeleteModal(false); setDeleteConfirm(""); setDeleteReason(""); await loadProfile(); toast.success("Deletion scheduled.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to request deletion."); } finally { setRequestingDelete(false); }
  };

  const cancelDeletion = async () => {
    setCancelingDelete(true);
    try {
      const res = await fetch("/api/users/account/cancel-delete", { method: "POST" });
      if (!res.ok) throw new Error(await parseError(res, "Failed to cancel deletion."));
      await loadProfile(); toast.success("Deletion request cancelled.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to cancel deletion."); } finally { setCancelingDelete(false); }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut({ callbackUrl: "/login" }); } finally { setSigningOut(false); }
  };

  if (loading) return <div className="page-shell px-6">Loading settings...</div>;
  const deleting = Boolean(profile?.deletionStatus.scheduledDeletionAt);

  return (
    <div className="page-shell ambient-grid">
      <main className="page-main space-y-6">
        <header><h1 className="page-title display-title text-4xl font-bold text-[#17130f]">Settings</h1><p className="text-sm text-[var(--muted-foreground)] mt-2">Profile, security, privacy and product defaults.</p></header>

        <section className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 break-words">
          <p className="text-sm font-semibold text-[#17130f] break-words">{profile?.name}</p><p className="text-xs text-[var(--muted-foreground)] break-all">{profile?.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(profile?.providerInfo.providers ?? []).map((provider) => (
              <span
                key={provider}
                className="rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
              >
                {provider}
              </span>
            ))}
          </div>
          <div className="mt-3 text-xs text-[var(--muted-foreground)]">{providerLabel}</div>
          <div className="mt-3 text-xs text-[var(--muted-foreground)]">{reauthLabel}</div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
            <h2 className="display-title text-2xl text-[#17130f]">Profile</h2>
            <Input label="Full name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" id="email" value={profile?.email ?? ""} disabled />
            <Button type="button" onClick={saveProfile} disabled={savingProfile} className="w-auto px-6">{savingProfile ? "Saving..." : "Save profile"}</Button>
          </div>

          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
            <h2 className="display-title text-2xl text-[#17130f]">Re-authentication</h2>
            {profile?.providerInfo.passwordLogin ? (
              <>
                <Input label="Current password" id="reauthPassword" type="password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} />
                <Button type="button" onClick={() => doReauth("password")} disabled={reauthing} className="w-auto px-6">{reauthing ? "Verifying..." : "Verify identity"}</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--muted-foreground)]">Google-only accounts must use a fresh Google sign-in for sensitive actions. If verification fails, sign out, sign back in with Google, then retry within 10 minutes.</p>
                <Button type="button" onClick={() => doReauth("google")} disabled={reauthing} className="w-auto px-6">{reauthing ? "Verifying..." : "Verify with Google"}</Button>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
            <h2 className="display-title text-2xl text-[#17130f]">{profile?.hasPassword ? "Change password" : "Set backup password"}</h2>
            {profile?.hasPassword ? (
              <>
                <Input label="Current password" id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input label="New password" id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input label="Confirm new password" id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button type="button" onClick={changePassword} disabled={updatingPassword} className="w-auto px-6">{updatingPassword ? "Updating..." : "Update password"}</Button>
              </>
            ) : (
              <>
                <Input label="New backup password" id="setupPassword" type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} />
                <Input label="Confirm backup password" id="setupConfirmPassword" type="password" value={setupConfirmPassword} onChange={(e) => setSetupConfirmPassword(e.target.value)} />
                <Button type="button" onClick={setupPasswordAction} disabled={settingPassword} className="w-auto px-6">{settingPassword ? "Saving..." : "Set backup password"}</Button>
              </>
            )}
          </div>

          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-4">
            <h2 className="display-title text-2xl text-[#17130f]">Preferences</h2>
            <Input label="Default country (2-letter)" id="newsCountry" value={prefs.newsCountry} onChange={(e) => setPrefs((p) => ({ ...p, newsCountry: e.target.value.toLowerCase().slice(0, 2) }))} />
            <div className="flex flex-wrap gap-2">{NEWS_CATEGORY_OPTIONS.map((c) => <button key={c} type="button" onClick={() => setPrefs((p) => ({ ...p, newsCategories: p.newsCategories.includes(c) ? p.newsCategories.filter((x) => x !== c) : [...p.newsCategories, c] }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${prefs.newsCategories.includes(c) ? "bg-[#12100d] text-[#f7f1e6] border-[#12100d]" : "bg-[#fffdf8] text-[var(--muted-foreground)] border-[var(--line)]"}`}>{c}</button>)}</div>
            <select value={prefs.detectionInputMode} onChange={(e) => setPrefs((p) => ({ ...p, detectionInputMode: e.target.value as DetectionInputMode }))} className="w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[#fffdf8] text-[#17130f]"><option value="auto">Auto</option><option value="headline_only">Headline only</option><option value="full_article">Full article</option><option value="headline_plus_article">Headline + article</option></select>
            <select value={prefs.detectionExplanationMode} onChange={(e) => setPrefs((p) => ({ ...p, detectionExplanationMode: e.target.value as DetectionExplanationMode }))} className="w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[#fffdf8] text-[#17130f]"><option value="auto">Auto explanation</option><option value="none">No explanation</option></select>
            <Button type="button" onClick={savePrefs} disabled={savingPrefs} className="w-auto px-6">{savingPrefs ? "Saving..." : "Save preferences"}</Button>
          </div>
        </section>

        <section>
          <ExtensionTokenCard />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-3">
            <h2 className="display-title text-2xl text-[#17130f]">Active sessions</h2>
            {sessions.map((s) => (
              <div key={s.sessionId} className="rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#17130f] break-words">{s.deviceLabel}{s.isCurrent ? " (Current)" : ""}</p>
                  <p className="text-xs text-[var(--muted-foreground)] break-all">{s.ipPreview}</p>
                  <p className="text-xs text-[var(--muted-foreground)] break-words">Created: {formatDate(s.createdAt)} | Last seen: {formatDate(s.lastSeenAt)}</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => revokeSession(s.sessionId)} disabled={s.isCurrent || revokingSessionId === s.sessionId} className="w-full sm:w-auto px-4 h-9">{revokingSessionId === s.sessionId ? "..." : "Revoke"}</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={revokeOthers} disabled={revokingOthers || profile?.securitySummary.reauthRequired} className="w-full sm:w-auto px-5">{revokingOthers ? "Revoking..." : "Revoke all other sessions"}</Button>
          </div>

          <div className="min-w-0 rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-3">
            <h2 className="display-title text-2xl text-[#17130f]">Privacy & data</h2>
            <div className="rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-3">
              <p className="text-sm font-semibold text-[#17130f]">Export my data</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="button" onClick={requestExport} disabled={requestingExport} className="w-full sm:w-auto px-5 h-9">{requestingExport ? "Preparing..." : "Request export"}</Button>
                {exportJob?.downloadUrl && <a href={exportJob.downloadUrl} className="text-xs font-semibold text-[#17130f] hover:text-[var(--accent)] break-all">Download JSON</a>}
              </div>
              {exportJob && <p className="text-xs text-[var(--muted-foreground)] mt-2">Status: {exportJob.status}{exportJob.expiresAt ? ` - Expires ${formatDate(exportJob.expiresAt)}` : ""}</p>}
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Deletion requests are soft-deleted first, then permanently removed after 30 days.</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
              <p className="text-sm font-semibold text-red-800">Danger zone</p>
              {deleting ? <><p className="text-xs text-red-700 mt-1 break-words">Scheduled for {formatDate(profile?.deletionStatus.scheduledDeletionAt ?? null)}</p><Button type="button" variant="secondary" onClick={cancelDeletion} disabled={cancelingDelete} className="w-full sm:w-auto px-4 h-9 mt-2">{cancelingDelete ? "Cancelling..." : "Cancel deletion request"}</Button></> : <Button type="button" onClick={() => setDeleteModal(true)} disabled={requestingDelete} className="w-full sm:w-auto px-4 h-9 mt-2 bg-red-700 text-white hover:bg-red-800">Request account deletion</Button>}
            </div>
            <div className="text-xs font-semibold text-[var(--muted-foreground)] flex flex-wrap gap-3"><a href="/privacy" className="hover:text-[#17130f]">Privacy</a><a href="/terms" className="hover:text-[#17130f]">Terms</a><a href="mailto:support@truthlens.app" className="hover:text-[#17130f] break-all">Contact</a><a href="mailto:support@truthlens.app?subject=TruthLens%20Issue%20Report" className="hover:text-[#17130f] break-all">Report issue</a></div>
          </div>
        </section>

        <Button type="button" variant="secondary" onClick={() => setLogoutOpen(true)} className="w-auto px-6">Sign out</Button>
        <ConfirmDialog open={logoutOpen} title="Sign out" message="Are you sure you want to sign out?" confirmLabel="Sign out" cancelLabel="Cancel" isLoading={signingOut} onConfirm={async () => { await handleSignOut(); }} onCancel={() => setLogoutOpen(false)} />

        {deleteModal && (
          <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center overflow-y-auto bg-black/45 backdrop-blur px-4 py-4">
            <div className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[#fffdf8] p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-[#17130f]">Confirm account deletion</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Type DELETE to confirm.</p>
              <Input label='Type "DELETE"' id="deleteConfirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <div className="mt-3"><label htmlFor="deleteReason" className="text-sm font-semibold text-[#17130f]">Reason (optional)</label><textarea id="deleteReason" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] bg-[#fffdf8] px-3 py-2 text-sm" /></div>
              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setDeleteModal(false)} className="w-full sm:w-auto px-4">Cancel</Button><Button type="button" onClick={requestDeletion} disabled={requestingDelete} className="w-full sm:w-auto px-4 bg-red-700 text-white hover:bg-red-800">{requestingDelete ? "Submitting..." : "Request deletion"}</Button></div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
