"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // TODO: Implement actual login logic
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Login:", { email });
      // Redirect or show success message
    } catch {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg p-8 sm:p-9">
      <div className="mb-6">
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Logging in..." : "Continue"}
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
  );
}
