"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

type ResetPasswordFormProps = {
  token?: string;
};

export default function ResetPasswordForm({ token = "" }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error("This reset link is missing a token.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Unable to reset your password.");
        return;
      }

      toast.success("Password updated.");
      router.push("/login?reset=success");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-[var(--line)] bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] p-6 sm:p-8 overflow-hidden auth-appear-delay">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#12100d] via-[var(--accent)] to-[#e8b074]" />
      <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-[rgba(14,124,102,0.14)] blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[rgba(232,176,116,0.2)] blur-3xl" />

      <div className="relative">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#847868] uppercase">
            Secure reset
          </p>
          <h1 className="page-title display-title text-3xl font-bold text-[#17130f] mb-2">
            Set a new password
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Choose a new password for your TruthLens account.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-[rgba(199,103,84,0.22)] bg-[rgba(199,103,84,0.08)] px-4 py-4 text-sm text-[#7b2d1f]">
            This reset link is invalid or incomplete. Request a fresh email to continue.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <Input
            label="New password"
            id="password"
            type="password"
            placeholder="Minimum 10 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token || isLoading}
          />

          <Input
            label="Confirm password"
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token || isLoading}
          />

          <p className="text-xs text-[var(--muted-foreground)]">
            Use at least 10 characters. This reset link expires after 30 minutes.
          </p>

          <Button type="submit" disabled={!token || isLoading} className="mt-2">
            {isLoading ? "Updating password..." : "Update password"}
          </Button>

          <div className="text-center text-sm text-[var(--muted-foreground)] mt-3">
            Need a new email?{" "}
            <Link
              href="/forgot-password"
              className="text-[#17130f] font-semibold hover:text-[var(--accent)]"
            >
              Request another reset link
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
