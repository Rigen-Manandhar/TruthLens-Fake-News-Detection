"use client";

import { useCallback, useMemo, useState } from "react";
import type { SessionContextValue } from "next-auth/react";
import toast from "react-hot-toast";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/shared/settings";
import { fetchProfile } from "../api";
import { updatePreferences, updateProfileName } from "../actions";
import type { AccountProfile } from "../types";
import { formatDate } from "../utils";

export function useProfileSettings(update: SessionContextValue["update"]) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadProfile = useCallback(async () => {
    const user = await fetchProfile();
    setProfile(user);
    setName(user.name);
    setPrefs({ ...DEFAULT_USER_PREFERENCES, ...user.preferences });
  }, []);

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

  const reauthLabel = useMemo(() => {
    if (!profile) {
      return "Unknown";
    }
    return profile.securitySummary.reauthRequired
      ? "Required for sensitive actions"
      : `Verified until ${formatDate(profile.securitySummary.reauthUntil)}`;
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

  return {
    profile,
    setProfile,
    name,
    setName,
    prefs,
    setPrefs,
    savingProfile,
    savingPrefs,
    providerLabel,
    reauthLabel,
    loadProfile,
    saveProfile,
    savePreferences,
  };
}
