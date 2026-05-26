import type { CSSProperties } from "react";

/**
 * The page's CredibilityLevel encodes credibility, not risk:
 *   - "high"  = high credibility → "Lower Risk"  (verdict LIKELY REAL)
 *   - "mixed" = "Needs Review"                   (verdict UNCERTAIN / overrides)
 *   - "low"   = low credibility  → "Higher Risk" (verdict SUSPICIOUS)
 *
 * The risk meter reads left-to-right as Lower → Needs Review → Higher, so
 * "high" credibility lands in the LEFT band and "low" credibility lands in
 * the RIGHT band. This was the cause of the verdict-vs-pointer mismatch.
 */
type CredibilityLevel = "high" | "mixed" | "low";

interface RiskMeterProps {
  level: CredibilityLevel;
  riskLabel: string;
  finalScore?: number;
  disabled?: boolean;
}

// Visual padding so the pointer never sits flush against either edge.
const POINTER_MIN = 0.04;
const POINTER_MAX = 0.96;
const USABLE_WIDTH = POINTER_MAX - POINTER_MIN;
const BAND_WIDTH = USABLE_WIDTH / 3;

const levelTextClass: Record<CredibilityLevel, string> = {
  // high credibility = lower risk = green
  high: "text-emerald-800 dark:text-emerald-300",
  mixed: "text-amber-800 dark:text-amber-300",
  // low credibility = higher risk = red
  low: "text-red-800 dark:text-red-300",
};

/**
 * Backend sends `final_score` as either:
 *   - a signed integer roughly in [-100, 100] (current scoring.py output), or
 *   - a signed float in [-1, 1] (legacy / probabilistic output).
 *
 * Either way we want a 0..1 magnitude where 0 = strongly likely real and
 * 1 = strongly suspicious, so the pointer can be placed deterministically.
 */
const normalizeScore = (value: number): number => {
  const signedScore = Math.abs(value) <= 1 ? value * 100 : value;
  const meterScore = (signedScore + 100) / 200;
  return Math.max(0, Math.min(1, meterScore));
};

/**
 * Map a normalized 0..1 score to a position inside the band that matches the
 * verdict's credibility level. Anchoring to the band fixes the
 * "verdict says Lower Risk but pointer sits in Higher Risk" mismatch that
 * happens whenever the backend overrides the verdict (CONFLICT,
 * LOW_CONFIDENCE, FETCH_FAILED) and leaves the raw score outside that band.
 */
const positionForBand = (
  level: CredibilityLevel,
  normalized: number
): number => {
  switch (level) {
    case "high":
      // Lower Risk → green band on the left
      return POINTER_MIN + normalized * BAND_WIDTH;
    case "mixed":
      // Needs Review → amber band in the middle
      return POINTER_MIN + BAND_WIDTH + normalized * BAND_WIDTH;
    case "low":
      // Higher Risk → red band on the right
      return POINTER_MIN + 2 * BAND_WIDTH + normalized * BAND_WIDTH;
  }
};

const clampPosition = (value: number) =>
  Math.max(POINTER_MIN, Math.min(POINTER_MAX, value));

export default function RiskMeter({
  level,
  riskLabel,
  finalScore,
  disabled = false,
}: RiskMeterProps) {
  const hasScore = !disabled && typeof finalScore === "number";
  const normalized = hasScore ? normalizeScore(finalScore as number) : 0.5;
  const position = hasScore
    ? clampPosition(positionForBand(level, normalized))
    : 0.5;
  // Display percent matches the pointer position so users never see a verdict
  // band that disagrees with the percentage. Always 0–100, always inside the
  // band corresponding to the verdict label.
  const percent = hasScore ? Math.round(position * 100) : null;

  const pointerStyle: CSSProperties = {
    left: `${position * 100}%`,
  };

  return (
    <div
      role="img"
      aria-label={`Risk level: ${riskLabel}${
        percent !== null ? ` (${percent}%)` : ""
      }`}
      className="rounded-2xl border border-(--line) bg-(--surface-strong) px-4 py-4"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
            Risk meter
          </span>
          <span
            className={`text-sm font-semibold ${
              disabled ? "text-(--muted-foreground)" : levelTextClass[level]
            }`}
          >
            {riskLabel}
          </span>
        </div>
        {percent !== null && (
          <span className="text-xs font-semibold text-(--muted-foreground-strong)">
            Score {percent}%
          </span>
        )}
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-(--surface-pill)">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1/3 bg-emerald-300/45 dark:bg-emerald-500/25"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-300/45 dark:bg-amber-500/25"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/3 bg-red-300/45 dark:bg-red-500/25"
        />
        {hasScore && (
          <span
            aria-hidden
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--surface) bg-(--ink) shadow-[0_4px_10px_rgba(24,16,8,0.32)]"
            style={pointerStyle}
          />
        )}
      </div>

      <div
        aria-hidden
        className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-(--muted-foreground)"
      >
        <span>Lower</span>
        <span>Needs review</span>
        <span>Higher</span>
      </div>

      {!hasScore && (
        <p className="mt-3 text-xs text-(--muted-foreground)">
          Awaiting input — run an assessment to see where the result lands on the
          risk scale.
        </p>
      )}
    </div>
  );
}
