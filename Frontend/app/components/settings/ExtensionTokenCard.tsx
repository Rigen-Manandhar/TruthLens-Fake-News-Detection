"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../ui/Button";

type ExtensionTokenResponse = {
  token: string;
  version: number;
  rotatedAt: string | null;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not rotated yet";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not rotated yet" : date.toLocaleString();
};

export default function ExtensionTokenCard() {
  const [tokenData, setTokenData] = useState<ExtensionTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadToken = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users/extension-token", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | (ExtensionTokenResponse & { error?: string })
        | null;

      if (!res.ok || !json?.token) {
        throw new Error(json?.error ?? "Failed to issue extension token.");
      }

      setTokenData(json);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to issue extension token.");
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateToken = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/users/extension-token", {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as
        | (ExtensionTokenResponse & { error?: string })
        | null;

      if (!res.ok || !json?.token) {
        throw new Error(json?.error ?? "Failed to regenerate extension token.");
      }

      setTokenData(json);
      toast.success("Extension token regenerated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to regenerate extension token."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToken = async () => {
    if (!tokenData?.token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(tokenData.token);
      toast.success("Extension token copied.");
    } catch {
      toast.error("Failed to copy token.");
    }
  };

  return (
    <div className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-6 space-y-4">
      <div>
        <h2 className="display-title text-2xl text-[#17130f]">Extension feedback token</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-2">
          Use this token in the Chrome extension so feedback submissions are tied to
          your account.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={loadToken}
          disabled={isLoading || isRegenerating}
          className="w-auto px-6"
        >
          {tokenData ? (isLoading ? "Refreshing..." : "Refresh token") : isLoading ? "Issuing..." : "Issue token"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={regenerateToken}
          disabled={isRegenerating}
          className="w-auto px-6"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate token"}
        </Button>
      </div>

      {tokenData && (
        <>
          <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Current token
            </p>
            <textarea
              readOnly
              value={tokenData.token}
              className="mt-3 min-h-28 w-full rounded-xl border border-[var(--line)] bg-[#f7f1e6] px-3 py-3 text-xs text-[#17130f] focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
              <span>Version: {tokenData.version}</span>
              <span>Last rotation: {formatDateTime(tokenData.rotatedAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              Regenerating invalidates the previously copied token.
            </p>
            <Button type="button" variant="secondary" onClick={copyToken} className="w-auto px-6">
              Copy token
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
