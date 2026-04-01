"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

const SUCCESS_MESSAGE = "If an account exists for that email, we've sent a reset link.";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Unable to send a reset link right now.");
        return;
      }

      setSuccessMessage(data.message ?? SUCCESS_MESSAGE);
      toast.success("If your email is registered, a reset link is on the way.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-(--line) bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] p-6 sm:p-8 overflow-hidden auth-appear-delay">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#12100d] via-(--accent) to-[#e8b074]" />
      <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-[rgba(14,124,102,0.14)] blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[rgba(232,176,116,0.2)] blur-3xl" />

      <div className="relative">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#847868] uppercase">
            Account recovery
          </p>
          <h1 className="page-title display-title text-3xl font-bold text-[#17130f] mb-2">
            Forgot your password?
          </h1>
          <p className="text-sm text-(--muted-foreground)">
            Enter your email and we&apos;ll send a one-time reset link from TruthLens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {successMessage ? (
            <p className="rounded-2xl border border-[rgba(14,124,102,0.18)] bg-[rgba(14,124,102,0.08)] px-4 py-3 text-sm text-[#0e7c66]">
              {successMessage}
            </p>
          ) : (
            <p className="text-xs text-(--muted-foreground)">
              The link expires in 30 minutes. If your account uses Google only, this
              email will also let you create a password.
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? "Sending reset link..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-(--muted-foreground) mt-3">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-[#17130f] font-semibold hover:text-(--accent)"
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
