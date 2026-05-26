import type { CSSProperties } from "react";

type RiskLevel = "high" | "mixed" | "low";

interface RiskMeterProps {
  level: RiskLevel;
  riskLabel: string;
  finalScore?: number;
  riskLevelText?: string;
  disabled?: boolean;
}

const POINTER_MIN = 0.04;
const POINTER_MAX = 0.96;

const levelTextClass: Record<RiskLevel, string> = {
  low: "text-emerald-800",
  mixed: "text-amber-800",
  high: "text-red-800",
};

const clampPointer = (value: number) =>
  Math.max(POINTER_MIN, Math.min(POINTER_MAX, value));

export default function RiskMeter({
  level,
  riskLabel,
  finalScore,
  riskLevelText,
  disabled = false,
}: RiskMeterProps) {
  const hasScore = !disabled && typeof finalScore === "number";
  const clamped = hasScore ? clampPointer(finalScore as number) : 0.5;
  const percent = hasScore ? Math.round((finalScore as number) * 100) : null;

  const pointerStyle: CSSProperties = {
    left: `${clamped * 100}%`,
  };

  return (
    <div
      role="img"
      aria-label={`Risk level: ${riskLabel}`}
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
            {riskLevelText && riskLevelText !== riskLabel && !disabled
              ? ` · ${riskLevelText}`
              : ""}
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
          className="absolute inset-y-0 left-0 w-1/3 bg-emerald-300/45"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-300/45"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/3 bg-red-300/45"
        />
        {hasScore && (
          <span
            aria-hidden
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--ink) shadow-[0_4px_10px_rgba(24,16,8,0.32)]"
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
