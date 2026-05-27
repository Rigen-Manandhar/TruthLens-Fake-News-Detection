"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { usePrivacySettings } from "./hooks/usePrivacySettings";
import { useProfileSettings } from "./hooks/useProfileSettings";
import { useSecuritySettings } from "./hooks/useSecuritySettings";
import { useSessionSettings } from "./hooks/useSessionSettings";

export function useSettingsController() {
  const { status, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profileSettings = useProfileSettings(update);
  const sessionSettings = useSessionSettings();
  const securitySettings = useSecuritySettings(profileSettings.loadProfile);
  const privacySettings = usePrivacySettings(profileSettings.loadProfile);
  const { loadProfile } = profileSettings;
  const { loadSessions } = sessionSettings;

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadProfile(),
          loadSessions(),
        ]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [
    loadProfile,
    loadSessions,
    status,
  ]);

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
    profile: profileSettings.profile,
    name: profileSettings.name,
    setName: profileSettings.setName,
    prefs: profileSettings.prefs,
    setPrefs: profileSettings.setPrefs,
    sessions: sessionSettings.sessions,
    currentPassword: securitySettings.currentPassword,
    setCurrentPassword: securitySettings.setCurrentPassword,
    newPassword: securitySettings.newPassword,
    setNewPassword: securitySettings.setNewPassword,
    confirmPassword: securitySettings.confirmPassword,
    setConfirmPassword: securitySettings.setConfirmPassword,
    setupPassword: securitySettings.setupPassword,
    setSetupPassword: securitySettings.setSetupPassword,
    setupConfirmPassword: securitySettings.setupConfirmPassword,
    setSetupConfirmPassword: securitySettings.setSetupConfirmPassword,
    reauthPassword: securitySettings.reauthPassword,
    setReauthPassword: securitySettings.setReauthPassword,
    exportJob: privacySettings.exportJob,
    deleteOpen: privacySettings.deleteOpen,
    setDeleteOpen: privacySettings.setDeleteOpen,
    deleteConfirm: privacySettings.deleteConfirm,
    setDeleteConfirm: privacySettings.setDeleteConfirm,
    deleteReason: privacySettings.deleteReason,
    setDeleteReason: privacySettings.setDeleteReason,
    savingProfile: profileSettings.savingProfile,
    savingPrefs: profileSettings.savingPrefs,
    updatingPassword: securitySettings.updatingPassword,
    settingPassword: securitySettings.settingPassword,
    reauthing: securitySettings.reauthing,
    revokingOthers: sessionSettings.revokingOthers,
    revokingSessionId: sessionSettings.revokingSessionId,
    requestingExport: privacySettings.requestingExport,
    requestingDelete: privacySettings.requestingDelete,
    cancelingDelete: privacySettings.cancelingDelete,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel: profileSettings.providerLabel,
    reauthLabel: profileSettings.reauthLabel,
    saveProfile: profileSettings.saveProfile,
    savePreferences: profileSettings.savePreferences,
    changePassword: securitySettings.changePassword,
    setupPasswordAction: securitySettings.setupPasswordAction,
    verifyReauth: securitySettings.verifyReauth,
    revokeSession: sessionSettings.revokeSession,
    revokeOthers: sessionSettings.revokeOthers,
    requestExport: privacySettings.requestExport,
    submitDeletion: privacySettings.submitDeletion,
    cancelDeletion: privacySettings.cancelDeletion,
    handleSignOut,
  };
}
