"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/shared/settings";
import { fetchExportJob, fetchProfile, fetchSessions } from "./api";
import {
  cancelAccountDeletion,
  reauthenticateUser,
  requestAccountDeletion,
  requestUserExport,
  revokeOtherSessions,
  revokeSessionById,
  setupPassword,
  updatePassword,
  updatePreferences,
  updateProfileName,
} from "./actions";
import type { AccountProfile, ExportJob, SessionItem } from "./types";
import { formatDate } from "./utils";

const EXPORT_POLL_INTERVAL_MS = 4000;

export function useSettingsController() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPasswordValue, setSetupPasswordValue] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [reauthing, setReauthing] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [requestingExport, setRequestingExport] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [cancelingDelete, setCancelingDelete] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const exportPollRef = useRef<number | null>(null);

  const loadProfile = useCallback(async () => {
    const user = await fetchProfile();
    setProfile(user);
    setName(user.name);
    setPrefs({ ...DEFAULT_USER_PREFERENCES, ...user.preferences });
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const list = await fetchSessions();
      setSessions(list);
    } catch (error) {
      // Sessions are non-critical; surface but don't block other settings.
      toast.error(error instanceof Error ? error.message : "Failed to load sessions.");
    }
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
        toast.error(
          error instanceof Error ? error.message : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadProfile, loadSessions, status]);

  // Stop polling when leaving the page.
  useEffect(() => {
    return () => {
      if (exportPollRef.current !== null) {
        window.clearTimeout(exportPollRef.current);
      }
    };
  }, []);

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

  const saveProfile = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const data = await updateProfileName(name);
      setProfile(data.user);
      setName(data.user.name);
      if (update) {
        await update({ name: data.user.name });
      }
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }, [name, update]);

  const savePreferences = useCallback(async () => {
    setSavingPrefs(true);
    try {
      const data = await updatePreferences(prefs);
      setProfile(data.user);
      setPrefs({ ...DEFAULT_USER_PREFERENCES, ...data.user.preferences });
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save preferences."
      );
    } finally {
      setSavingPrefs(false);
    }
  }, [prefs]);

  const changePasswordAction = useCallback(async () => {
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
      await reauthenticateUser({ method: "password", password: currentPassword });
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await loadProfile();
      toast.success("Password updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setUpdatingPassword(false);
    }
  }, [confirmPassword, currentPassword, loadProfile, newPassword]);

  const setupPasswordAction = useCallback(async () => {
    if (!setupPasswordValue || !setupConfirmPassword) {
      toast.error("Fill both password fields.");
      return;
    }

    if (setupPasswordValue !== setupConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSettingPassword(true);
    try {
      await reauthenticateUser({ method: "google" });
      await setupPassword(setupPasswordValue);
      setSetupPasswordValue("");
      setSetupConfirmPassword("");
      await loadProfile();
      toast.success("Backup password added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set password."
      );
    } finally {
      setSettingPassword(false);
    }
  }, [loadProfile, setupConfirmPassword, setupPasswordValue]);

  const verifyReauth = useCallback(
    async (method: "password" | "google") => {
      setReauthing(true);
      try {
        if (method === "password") {
          if (!reauthPassword) {
            toast.error("Enter your password.");
            return;
          }
          await reauthenticateUser({ method: "password", password: reauthPassword });
        } else {
          await reauthenticateUser({ method: "google" });
        }
        setReauthPassword("");
        await loadProfile();
        toast.success("Verified.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Re-authentication failed."
        );
      } finally {
        setReauthing(false);
      }
    },
    [loadProfile, reauthPassword]
  );

  const revokeSession = useCallback(
    async (sessionId: string) => {
      setRevokingSessionId(sessionId);
      try {
        await revokeSessionById(sessionId);
        await loadSessions();
        toast.success("Session revoked.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to revoke session."
        );
      } finally {
        setRevokingSessionId(null);
      }
    },
    [loadSessions]
  );

  const revokeOthers = useCallback(async () => {
    setRevokingOthers(true);
    try {
      await revokeOtherSessions();
      await loadSessions();
      toast.success("Other sessions revoked.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke sessions."
      );
    } finally {
      setRevokingOthers(false);
    }
  }, [loadSessions]);

  const pollExportJob = useCallback((jobId: string) => {
    if (exportPollRef.current !== null) {
      window.clearTimeout(exportPollRef.current);
    }

    const tick = async () => {
      try {
        const job = await fetchExportJob(jobId);
        setExportJob(job);
        if (job.status === "pending" || job.status === "processing") {
          exportPollRef.current = window.setTimeout(
            () => void tick(),
            EXPORT_POLL_INTERVAL_MS
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load export status."
        );
      }
    };

    void tick();
  }, []);

  const requestExport = useCallback(async () => {
    setRequestingExport(true);
    try {
      const job = await requestUserExport();
      setExportJob({
        jobId: job.jobId,
        status: job.status,
        downloadUrl: null,
        expiresAt: null,
      });
      pollExportJob(job.jobId);
      toast.success("Export requested.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request export."
      );
    } finally {
      setRequestingExport(false);
    }
  }, [pollExportJob]);

  const submitDeletion = useCallback(async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }

    setRequestingDelete(true);
    try {
      await requestAccountDeletion({
        confirmText: deleteConfirm,
        reason: deleteReason,
      });
      setDeleteConfirm("");
      setDeleteReason("");
      setDeleteOpen(false);
      await loadProfile();
      toast.success(
        "Deletion requested. Your account will be removed in 30 days unless cancelled."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to request deletion."
      );
    } finally {
      setRequestingDelete(false);
    }
  }, [deleteConfirm, deleteReason, loadProfile]);

  const cancelDeletion = useCallback(async () => {
    setCancelingDelete(true);
    try {
      await cancelAccountDeletion();
      await loadProfile();
      toast.success("Deletion cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel deletion."
      );
    } finally {
      setCancelingDelete(false);
    }
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setSigningOut(false);
    }
  }, []);

  return {
    loading,
    profile,
    name,
    setName,
    prefs,
    setPrefs,
    sessions,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setupPassword: setupPasswordValue,
    setSetupPassword: setSetupPasswordValue,
    setupConfirmPassword,
    setSetupConfirmPassword,
    reauthPassword,
    setReauthPassword,
    exportJob,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    deleteReason,
    setDeleteReason,
    savingProfile,
    savingPrefs,
    updatingPassword,
    settingPassword,
    reauthing,
    revokingOthers,
    revokingSessionId,
    requestingExport,
    requestingDelete,
    cancelingDelete,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    savePreferences,
    changePassword: changePasswordAction,
    setupPasswordAction,
    verifyReauth,
    revokeSession,
    revokeOthers,
    requestExport,
    submitDeletion,
    cancelDeletion,
    handleSignOut,
  };
}
