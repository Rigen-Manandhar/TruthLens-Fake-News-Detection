"use client";

import type { DeepfakeResponse, DeepfakeVerdict } from "./types";
import { ImageIcon } from "../ui/icons";

interface DeepfakeDetectionResultProps {
  result: DeepfakeResponse | null;
  isLoading: boolean;
}

const levelStyles: Record<DeepfakeVerdict, string> = {
  "Likely Authentic":
    "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/30",
  "Needs Review":
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30",
  "Likely Manipulated":
    "bg-red-50 text-red-900 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30",
};

export default function DeepfakeDetectionResult({
  result,
  isLoading,
}: DeepfakeDetectionResultProps) {
  const hasResult = result !== null;

  return (
    <section className="relative flex h-full flex-col rounded-3xl border border-(--line) bg-(--surface)/90 shadow-[0_22px_46px_rgba(24,16,8,0.1)] px-5 sm:px-8 py-6 sm:py-7 overflow-hidden lg:min-h-144">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-(--warm) via-(--accent) to-(--ink)" />

      <div className="relative flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-3">
          {hasResult ? (
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[result.verdict]} shrink-0 w-fit`}
            >
              Result: {result.verdict}
            </div>
          ) : (
            <div className="inline-flex items-center rounded-full border border-(--line) bg-(--surface-strong) px-3 py-1 text-xs font-semibold text-(--muted-foreground)">
              Upload media to see results
            </div>
          )}
          {hasResult && (
            <span className="inline-flex items-center rounded-full border border-(--line) bg-(--surface-strong) px-3 py-1 text-xs font-semibold text-(--muted-foreground)">
              Risk: {result.risk_level}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-(--accent) border-t-transparent animate-spin" />
            <p className="text-sm text-(--muted-foreground)">Analyzing media...</p>
          </div>
        )}

        {hasResult && !isLoading && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="font-semibold uppercase tracking-wide">What this result means</p>
              <p className="mt-1">
                TruthLens supports review. It cannot prove whether media is real or fake.
              </p>
            </div>

            <p className="text-sm text-(--foreground) leading-relaxed font-medium">
              {result.message}
            </p>

            <p className="text-xs text-(--muted-foreground)">
              Media type: {result.media_type === "image" ? "Image" : "Video"}
            </p>
          </div>
        )}

        {!hasResult && !isLoading && (
          <div className="mt-6 flex-1 flex flex-col items-center justify-center text-center">
            <ImageIcon aria-hidden className="h-10 w-10 text-(--muted-foreground)/60 mb-3" />
            <p className="text-sm text-(--muted-foreground)">
              Upload an image or video to assess whether visual manipulation signals are present.
            </p>
          </div>
        )}

        <p className="mt-auto pt-4 text-[11px] text-(--muted-foreground) shrink-0">
          Results powered by visual manipulation risk analysis.
        </p>
      </div>
    </section>
  );
}
