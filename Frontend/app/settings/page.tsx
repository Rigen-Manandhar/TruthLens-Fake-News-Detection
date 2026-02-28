"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Footer from "../components/Footer";
import ConfirmDialog from "../components/ui/ConfirmDialog";

type AccountProfile = {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
};

export default function SettingsPage() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (status !== "authenticated") {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile.");
        }
        const user: AccountProfile = data.user;
        setProfile(user);
        setName(user.name ?? "");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load profile."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [status]);

  const handleProfileSave = async () => {
    if (!profile) {
      return;
    }

    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }
      setProfile(data.user);
      toast.success("Profile updated.");
      if (update) {
        await update({ name: data.user.name });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!profile?.hasPassword) {
      toast.error("Password updates are not available for this account.");
      return;
    }

    if (!currentPassword || !newPassword) {
      toast.error("Please fill in your current and new password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOutRequest = () => {
    setIsLogoutOpen(true);
  };

  const handleSignOutCancel = () => {
    if (isSigningOut) {
      return;
    }
    setIsLogoutOpen(false);
  };

  const authLabel = profile?.hasPassword ? "Password login" : "Google connected";

  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -right-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-[11px] font-semibold tracking-[0.25em] text-[var(--muted-foreground)] uppercase shadow-[0_8px_20px_rgba(20,16,8,0.06)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Account
          </div>
          <h1 className="display-title text-4xl sm:text-[2.8rem] font-bold text-[#17130f] tracking-tight">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-2xl">
            Manage your profile details and security preferences.
          </p>
        </header>

        {isLoading ? (
          <section className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] shadow-[0_16px_30px_rgba(24,16,8,0.09)] p-8">
            <div className="h-5 w-40 bg-[#e6dccb] rounded-full animate-pulse" />
            <div className="mt-6 h-10 w-full bg-[#e6dccb] rounded-xl animate-pulse" />
            <div className="mt-4 h-10 w-full bg-[#e6dccb] rounded-xl animate-pulse" />
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] shadow-[0_16px_30px_rgba(24,16,8,0.09)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#12100d]/10 text-[#4f473c] flex items-center justify-center text-sm font-semibold">
                  {profile?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#17130f]">
                    {profile?.name || "Your account"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{profile?.email}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-[11px] font-semibold text-[var(--muted-foreground)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                {authLabel}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] shadow-[0_16px_30px_rgba(24,16,8,0.09)] p-6 sm:p-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.25em] text-[#857969] uppercase">
                    Profile
                  </p>
                  <h2 className="display-title text-2xl font-bold text-[#17130f] mt-2">
                    Personal details
                  </h2>
                </div>

                <div className="grid gap-4">
                  <Input
                    label="Full name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email"
                    id="email"
                    value={profile?.email ?? ""}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Updates are reflected across your account and sessions.
                  </p>
                  <Button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="w-auto px-6"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] shadow-[0_16px_30px_rgba(24,16,8,0.09)] p-6 sm:p-8 space-y-5">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.25em] text-[#857969] uppercase">
                    Security
                  </p>
                  <h2 className="display-title text-2xl font-bold text-[#17130f] mt-2">
                    Password
                  </h2>
                </div>

                {profile?.hasPassword ? (
                  <div className="grid gap-4">
                    <Input
                      label="Current password"
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      label="New password"
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm new password"
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="w-auto px-6"
                    >
                      {isUpdatingPassword ? "Updating..." : "Update password"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    This account uses Google sign-in. Password changes are not
                    available.
                  </p>
                )}

                <div className="border-t border-[var(--line)] pt-5">
                  <h3 className="text-sm font-semibold text-[#17130f]">
                    Sign out
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Sign out of your account on this device.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSignOutRequest}
                    className="mt-4 w-auto px-6"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        <ConfirmDialog
          open={isLogoutOpen}
          title="Sign out"
          message="Are you sure you want to sign out of your account?"
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          isLoading={isSigningOut}
          onConfirm={handleSignOut}
          onCancel={handleSignOutCancel}
        />

        <Footer />
      </main>
    </div>
  );
}
