"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { fetchProfile } from "./api";
import {
  reauthenticateUser,
  setupPassword,
  updatePassword,
  updateProfileName,
} from "./actions";
import type { AccountProfile } from "./types";
import { formatDate } from "./utils";

export function useSettingsController() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPasswordValue, setSetupPasswordValue] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    const user = await fetchProfile();
    setProfile(user);
    setName(user.name);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        await loadProfile();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadProfile, status]);

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
      await reauthenticateUser({ method: "google" });
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
    savingProfile,
    updatingPassword,
    settingPassword,
    logoutOpen,
    setLogoutOpen,
    signingOut,
    providerLabel,
    reauthLabel,
    saveProfile,
    changePassword: changePasswordAction,
    setupPasswordAction,
    handleSignOut,
  };
}
