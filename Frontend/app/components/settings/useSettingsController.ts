"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/shared/settings";
import { fetchExportJob, fetchProfile, fetchSessions } from "./api";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
  requestUserExport,
  reauthenticateUser,
  revokeOtherSessions,
  revokeSessionById,
  setupPassword,
  updatePassword,
  updatePreferences,
  updateProfileName,
} from "./actions";
import type { AccountProfile, ExportJob, SessionItem } from "./types";
import { formatDate } from "./utils";

export function useSettingsController() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [reauthPassword, setReauthPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPasswordValue, setSetupPasswordValue] = useState("");
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
  }, [loadProfile, loadSessions, status]);

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
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }, [name, update]);

  const savePrefs = useCallback(async () => {
    setSavingPrefs(true);
    try {
      const data = await updatePreferences(prefs);
      setProfile(data.user);
      setPrefs(data.user.preferences);
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }, [prefs]);

  const doReauth = useCallback(
    async (method: "password" | "google") => {
      setReauthing(true);
      try {
        await reauthenticateUser(
          method === "password"
            ? { method, password: reauthPassword }
            : { method }
        );
        setReauthPassword("");
        await loadProfile();
        toast.success("Identity verified.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Re-auth failed.");
      } finally {
        setReauthing(false);
      }
    },
    [loadProfile, reauthPassword]
  );

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
      await updatePassword({ currentPassword, newPassword });
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
      await setupPassword(setupPasswordValue);
      setSetupPasswordValue("");
      setSetupConfirmPassword("");
      await loadProfile();
      toast.success("Backup password added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set password.");
    } finally {
      setSettingPassword(false);
    }
  }, [loadProfile, setupConfirmPassword, setupPasswordValue]);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      setRevokingSessionId(sessionId);
      try {
        await revokeSessionById(sessionId);
        await Promise.all([loadSessions(), loadProfile()]);
        toast.success("Session revoked.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to revoke session.");
      } finally {
        setRevokingSessionId(null);
      }
    },
    [loadProfile, loadSessions]
  );

  const revokeOthersAction = useCallback(async () => {
    setRevokingOthers(true);
    try {
      await revokeOtherSessions();
      await Promise.all([loadSessions(), loadProfile()]);
      toast.success("Other sessions revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke sessions.");
    } finally {
      setRevokingOthers(false);
    }
  }, [loadProfile, loadSessions]);

  const requestExportAction = useCallback(async () => {
    setRequestingExport(true);
    try {
      const data = await requestUserExport();
      setExportJob(await fetchExportJob(data.jobId));
      toast.success("Export requested.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request export.");
    } finally {
      setRequestingExport(false);
    }
  }, []);

  const requestDeletionAction = useCallback(async () => {
    setRequestingDelete(true);
    try {
      await requestAccountDeletion({
        confirmText: deleteConfirm,
        reason: deleteReason,
      });
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
  }, [deleteConfirm, deleteReason, loadProfile]);

  const cancelDeletionAction = useCallback(async () => {
    setCancelingDelete(true);
    try {
      await cancelAccountDeletion();
      await loadProfile();
      toast.success("Deletion request cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel deletion.");
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
    sessions,
    name,
    setName,
    prefs,
    setPrefs,
    reauthPassword,
    setReauthPassword,
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
    deleteConfirm,
    setDeleteConfirm,
    deleteReason,
    setDeleteReason,
    exportJob,
    savingProfile,
    savingPrefs,
    reauthing,
    updatingPassword,
    settingPassword,
    revokingOthers,
    revokingSessionId,
    requestingExport,
    requestingDelete,
    cancelingDelete,
    deleteModal,
    setDeleteModal,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    savePrefs,
    doReauth,
    changePassword: changePasswordAction,
    setupPasswordAction,
    revokeSession,
    revokeOthers: revokeOthersAction,
    requestExport: requestExportAction,
    requestDeletion: requestDeletionAction,
    cancelDeletion: cancelDeletionAction,
    handleSignOut,
  };
}
