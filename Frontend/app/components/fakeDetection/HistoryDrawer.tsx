"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "focus-trap-react";
import type {
  DetectionHistoryEntry,
} from "./useDetectionHistory";
import { History, RefreshCw, Trash2, X } from "../ui/icons";

interface HistoryDrawerProps {
  open: boolean;
  entries: DetectionHistoryEntry[];
  onClose: () => void;
  onRerun: (entry: DetectionHistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const verdictPillClass = (verdict: string) => {
  const v = verdict.toUpperCase();
  if (v.includes("HIGHER") || v.includes("SUSPICIOUS")) {
    return "border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200";
  }
  if (v.includes("LOWER") || v.includes("LIKELY REAL")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200";
};

const formatRelative = (iso: string) => {
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return created.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function HistoryDrawer({
  open,
  entries,
  onClose,
  onRerun,
  onRemove,
  onClear,
}: HistoryDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const drawer = (
    <FocusTrap
      active={open}
      focusTrapOptions={{
        initialFocus: "[data-history-drawer-close]",
        returnFocusOnDeactivate: true,
        allowOutsideClick: true,
        escapeDeactivates: false,
      }}
    >
      <div
        className="fixed inset-0 z-60 flex bg-gray-900/45 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Recent assessments"
          className="ml-auto flex h-full w-full max-w-md flex-col border-l border-(--line) bg-(--surface) shadow-[-25px_0_60px_-35px_rgba(15,23,42,0.45)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3 border-b border-(--line) px-5 py-4">
            <div className="flex items-center gap-2">
              <History
                aria-hidden
                className="h-5 w-5 text-(--muted-foreground-strong)"
              />
              <h2 className="text-base font-semibold text-(--foreground-strong)">
                Recent assessments
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-history-drawer-close
              aria-label="Close history drawer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-(--muted-foreground-strong) transition-colors hover:bg-(--surface-hover) hover:text-(--foreground-strong)"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {entries.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">
                No recent assessments. Once you run an analysis, it will appear
                here so you can re-run it without re-pasting.
              </p>
            ) : (
              <ul className="space-y-3">
                {entries.map((entry) => {
                  const previewText = entry.inputExcerpt
                    ? entry.inputExcerpt
                    : entry.sourceUrl || "(empty input)";
                  return (
                    <li
                      key={entry.id}
                      className="rounded-2xl border border-(--line) bg-(--surface-strong) p-3 shadow-[0_8px_18px_rgba(24,16,8,0.05)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${verdictPillClass(
                            entry.verdict
                          )}`}
                        >
                          {entry.verdict}
                        </span>
                        <span className="text-[11px] text-(--muted-foreground)">
                          {formatRelative(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs text-(--foreground-strong)">
                        {previewText}
                      </p>
                      {entry.sourceUrl && entry.inputExcerpt && (
                        <p className="mt-1 truncate text-[11px] text-(--muted-foreground)">
                          {entry.sourceUrl}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onRerun(entry)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-(--surface) px-3 py-1 text-[11px] font-semibold text-(--foreground-strong) transition-colors hover:bg-(--surface-hover)"
                        >
                          <RefreshCw aria-hidden className="h-3.5 w-3.5" />
                          Reload
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(entry.id)}
                          aria-label="Remove this entry"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-(--muted-foreground) transition-colors hover:bg-(--surface-hover) hover:text-red-600"
                        >
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {entries.length > 0 && (
            <footer className="border-t border-(--line) px-5 py-3 text-right">
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-(--muted-foreground) transition-colors hover:text-red-700"
              >
                Clear history
              </button>
            </footer>
          )}
        </div>
      </div>
    </FocusTrap>
  );

  return createPortal(drawer, document.body);
}
