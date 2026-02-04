"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
        return;
      }

      toast.success("Welcome back.");
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
    <div className="relative w-full max-w-md rounded-3xl bg-white/90 backdrop-blur border border-white/60 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)] p-8 sm:p-9 overflow-hidden auth-appear-delay">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />
      <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-gray-400 uppercase">
            Secure access
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to continue your TruthLens experience.
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

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
          <p className="text-xs text-gray-500">
            Use your account password or continue with Google.
          </p>

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? "Logging in..." : "Continue"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-gray-200" />
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

          <p className="text-center text-sm text-gray-600 mt-3">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-gray-900 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
