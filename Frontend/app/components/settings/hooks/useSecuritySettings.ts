"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  reauthenticateUser,
  setupPassword,
  updatePassword,
} from "../actions";

export function useSecuritySettings(loadProfile: () => Promise<void>) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupPasswordValue, setSetupPasswordValue] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [reauthing, setReauthing] = useState(false);

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

  return {
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
    updatingPassword,
    settingPassword,
    reauthing,
    changePassword: changePasswordAction,
    setupPasswordAction,
    verifyReauth,
  };
}
