"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (password.length < 10) {
      toast.error("Password must be at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Signup failed. Please try again.");
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        toast.error("Account created, but login failed. Please sign in.");
        return;
      }

      toast.success("Account created. Welcome to TruthLens.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="relative w-full max-w-md rounded-3xl border border-(--line) bg-[#fffdfa]/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] p-6 sm:p-8 overflow-hidden auth-appear-delay">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#12100d] via-(--accent) to-[#e8b074]" />
      <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-[rgba(14,124,102,0.14)] blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[rgba(232,176,116,0.2)] blur-3xl" />

      <div className="relative">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#847868] uppercase">
            Start smart
          </p>
          <h1 className="page-title display-title text-3xl font-bold text-[#17130f] mb-2">
            Create your account
          </h1>
          <p className="text-sm text-(--muted-foreground)">
            Join TruthLens to personalise your news feed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          id="fullName"
          type="text"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Minimum 10 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Confirm password"
          id="confirmPassword"
          type="password"
          placeholder="Re-enter Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#17130f] hover:text-(--accent)"
            >
              Forgot password?
            </Link>
          </div>
          <p className="text-xs text-(--muted-foreground)">
            Use at least 10 characters. You can also sign up with Google.
          </p>

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-[#8a7d6d]">
            <div className="h-px flex-1 bg-(--line)" />
            <span>or</span>
            <div className="h-px flex-1 bg-(--line)" />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 48 48"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.2 0 5.9 1.1 8.1 3.1l6-6C34.4 3.2 29.7 1 24 1 14.9 1 7.1 6.1 3.3 13.6l7 5.4C12.1 13.2 17.6 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.5 24.5c0-1.7-.1-3-.4-4.4H24v8.3h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4 7.2-9.9 7.2-16.9z"
              />
              <path
                fill="#4A90E2"
                d="M10.3 28.6c-1-3-1-6.2 0-9.2l-7-5.4c-2.7 5.4-2.7 12.2 0 17.6l7-3z"
              />
              <path
                fill="#FBBC05"
                d="M24 47c5.8 0 10.7-1.9 14.3-5.1l-7.5-5.8c-2 1.4-4.6 2.2-6.8 2.2-6.4 0-11.9-3.7-13.7-9l-7 5.4C7.1 41.9 14.9 47 24 47z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-(--muted-foreground) mt-3">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#17130f] font-semibold hover:text-(--accent)"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
