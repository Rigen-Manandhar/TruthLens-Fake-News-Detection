"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Footer from "../components/Footer";
import AccountSummaryCard from "../components/settings/AccountSummaryCard";
import { fetchExportJob, fetchProfile, fetchSessions } from "../components/settings/api";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import ExtensionTokenCard from "../components/settings/ExtensionTokenCard";
import PasswordSection from "../components/settings/PasswordSection";
import PreferencesSection from "../components/settings/PreferencesSection";
import PrivacySection from "../components/settings/PrivacySection";
import ProfileSection from "../components/settings/ProfileSection";
import ReauthSection from "../components/settings/ReauthSection";
import SessionsSection from "../components/settings/SessionsSection";
import type {
  AccountProfile,
  ExportJob,
  SessionItem,
} from "../components/settings/types";
import { formatDate, parseError } from "../components/settings/utils";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/shared/settings";

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
    const user = await fetchProfile();
    setProfile(user);
    setName(user.name);
    setPrefs(user.preferences ?? DEFAULT_USER_PREFERENCES);
  }, []);

  const loadSessions = useCallback(async () => {
    const nextSessions = await fetchSessions();
    setSessions(nextSessions);
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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [status, loadProfile, loadSessions]);

  useEffect(() => {
    if (!exportJob || exportJob.status !== "processing") {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const nextJob = await fetchExportJob(exportJob.jobId);
        setExportJob(nextJob);
        if (nextJob.status === "completed") {
          toast.success("Export is ready.");
        }
      } catch {
        return;
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [exportJob]);

  const reauthLabel = useMemo(() => {
    if (!profile) {
      return "Unknown";
    }

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
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to update profile."));
      }

      const data = (await res.json()) as { user: AccountProfile };
      setProfile(data.user);
      setName(data.user.name);
      if (update) {
        await update({ name: data.user.name });
      }
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to save preferences."));
      }

      const data = (await res.json()) as { user: AccountProfile };
      setProfile(data.user);
      setPrefs(data.user.preferences);
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const doReauth = async (method: "password" | "google") => {
    setReauthing(true);
    try {
      const body: Record<string, string> = { method };
      if (method === "password") {
        body.password = reauthPassword;
      }

      const res = await fetch("/api/users/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Re-auth failed."));
      }

      setReauthPassword("");
      await loadProfile();
      toast.success("Identity verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-auth failed.");
    } finally {
      setReauthing(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to update password."));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await loadProfile();
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const setupPasswordAction = async () => {
    if (!setupPassword || !setupConfirmPassword) {
      toast.error("Fill both password fields.");
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSettingPassword(true);
    try {
      const res = await fetch("/api/users/password/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: setupPassword }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to set password."));
      }

      setSetupPassword("");
      setSetupConfirmPassword("");
      await loadProfile();
      toast.success("Backup password added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set password.");
    } finally {
      setSettingPassword(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch(`/api/users/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to revoke session."));
      }

      await loadSessions();
      await loadProfile();
      toast.success("Session revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const revokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const res = await fetch("/api/users/sessions/revoke-others", { method: "POST" });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to revoke sessions."));
      }

      await loadSessions();
      await loadProfile();
      toast.success("Other sessions revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke sessions.");
    } finally {
      setRevokingOthers(false);
    }
  };

  const requestExport = async () => {
    setRequestingExport(true);
    try {
      const res = await fetch("/api/users/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "json" }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to request export."));
      }

      const data = (await res.json()) as {
        jobId: string;
        status: "completed" | "processing";
      };
      setExportJob(await fetchExportJob(data.jobId));
      toast.success("Export requested.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request export.");
    } finally {
      setRequestingExport(false);
    }
  };

  const requestDeletion = async () => {
    setRequestingDelete(true);
    try {
      const res = await fetch("/api/users/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: deleteConfirm, reason: deleteReason }),
      });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to request deletion."));
      }

      setDeleteModal(false);
      setDeleteConfirm("");
      setDeleteReason("");
      await loadProfile();
      toast.success("Deletion scheduled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request deletion.");
    } finally {
      setRequestingDelete(false);
    }
  };

  const cancelDeletion = async () => {
    setCancelingDelete(true);
    try {
      const res = await fetch("/api/users/account/cancel-delete", { method: "POST" });
      if (!res.ok) {
        throw new Error(await parseError(res, "Failed to cancel deletion."));
      }

      await loadProfile();
      toast.success("Deletion request cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel deletion.");
    } finally {
      setCancelingDelete(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return <div className="page-shell px-6">Loading settings...</div>;
  }

  return (
    <div className="page-shell ambient-grid">
      <main className="page-main space-y-6">
        <header>
          <h1 className="page-title display-title text-4xl font-bold text-[#17130f]">
            Settings
          </h1>
          <p className="text-sm text-(--muted-foreground) mt-2">
            Profile, security, privacy and product defaults.
          </p>
        </header>

        <AccountSummaryCard
          profile={profile}
          providerLabel={providerLabel}
          reauthLabel={reauthLabel}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <ProfileSection
            name={name}
            email={profile?.email ?? ""}
            savingProfile={savingProfile}
            onNameChange={setName}
            onSave={saveProfile}
          />
          <ReauthSection
            profile={profile}
            reauthPassword={reauthPassword}
            reauthing={reauthing}
            onPasswordChange={setReauthPassword}
            onVerify={doReauth}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <PasswordSection
            profile={profile}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            setupPassword={setupPassword}
            setupConfirmPassword={setupConfirmPassword}
            updatingPassword={updatingPassword}
            settingPassword={settingPassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSetupPasswordChange={setSetupPassword}
            onSetupConfirmPasswordChange={setSetupConfirmPassword}
            onChangePassword={changePassword}
            onSetupPassword={setupPasswordAction}
          />
          <PreferencesSection
            prefs={prefs}
            savingPrefs={savingPrefs}
            onPrefsChange={setPrefs}
            onSave={savePrefs}
          />
        </section>

        <section>
          <ExtensionTokenCard />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SessionsSection
            sessions={sessions}
            profile={profile}
            revokingOthers={revokingOthers}
            revokingSessionId={revokingSessionId}
            onRevokeSession={revokeSession}
            onRevokeOthers={revokeOthers}
          />
          <PrivacySection
            profile={profile}
            exportJob={exportJob}
            requestingExport={requestingExport}
            requestingDelete={requestingDelete}
            cancelingDelete={cancelingDelete}
            onRequestExport={requestExport}
            onOpenDeleteModal={() => setDeleteModal(true)}
            onCancelDeletion={cancelDeletion}
          />
        </section>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setLogoutOpen(true)}
          className="w-auto px-6"
        >
          Sign out
        </Button>
        <ConfirmDialog
          open={logoutOpen}
          title="Sign out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          cancelLabel="Cancel"
          isLoading={signingOut}
          onConfirm={async () => {
            await handleSignOut();
          }}
          onCancel={() => setLogoutOpen(false)}
        />

        <DeleteAccountModal
          open={deleteModal}
          deleteConfirm={deleteConfirm}
          deleteReason={deleteReason}
          requestingDelete={requestingDelete}
          onDeleteConfirmChange={setDeleteConfirm}
          onDeleteReasonChange={setDeleteReason}
          onClose={() => setDeleteModal(false)}
          onSubmit={requestDeletion}
        />

        <Footer />
      </main>
    </div>
  );
}
