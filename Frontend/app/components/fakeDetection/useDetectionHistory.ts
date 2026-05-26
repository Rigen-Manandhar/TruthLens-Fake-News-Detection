"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DetectionInputMode } from "@/lib/shared/detection-feedback";

export type DetectionHistoryEntry = {
  id: string;
  createdAt: string;
  inputExcerpt: string;
  sourceUrl: string;
  inputMode: DetectionInputMode;
  verdict: string;
  riskLevel: string;
  finalScore: number | null;
};

type Envelope = {
  version: 1;
  entries: DetectionHistoryEntry[];
};

const STORAGE_KEY = "truthlens.detection.history";
const STORE_EVENT = "truthlens.detection.history:change";
const MAX_ENTRIES = 10;
const EXCERPT_LIMIT = 200;
const EMPTY_ENTRIES: DetectionHistoryEntry[] = [];

const isEntry = (value: unknown): value is DetectionHistoryEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.inputExcerpt === "string" &&
    typeof candidate.sourceUrl === "string" &&
    typeof candidate.inputMode === "string" &&
    typeof candidate.verdict === "string" &&
    typeof candidate.riskLevel === "string" &&
    (candidate.finalScore === null ||
      typeof candidate.finalScore === "number")
  );
};

const readEntries = (): DetectionHistoryEntry[] => {
  if (typeof window === "undefined") {
    return EMPTY_ENTRIES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_ENTRIES;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "entries" in parsed &&
      Array.isArray((parsed as Envelope).entries)
    ) {
      return (parsed as Envelope).entries.filter(isEntry).slice(0, MAX_ENTRIES);
    }
  } catch {
    /* malformed JSON or localStorage unavailable */
  }
  return EMPTY_ENTRIES;
};

let cachedEntries: DetectionHistoryEntry[] | null = null;

const getSnapshot = (): DetectionHistoryEntry[] => {
  if (cachedEntries === null) {
    cachedEntries = readEntries();
  }
  return cachedEntries;
};

const refreshSnapshot = () => {
  cachedEntries = readEntries();
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => {
    refreshSnapshot();
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(STORE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORE_EVENT, handler);
  };
};

const getServerSnapshot = (): DetectionHistoryEntry[] => EMPTY_ENTRIES;

const persist = (entries: DetectionHistoryEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }
  const trimmed = entries.slice(0, MAX_ENTRIES);
  cachedEntries = trimmed;
  try {
    if (trimmed.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      const envelope: Envelope = { version: 1, entries: trimmed };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    }
  } catch {
    /* private mode / quota exceeded — keep in-memory state for the session */
  }
  window.dispatchEvent(new Event(STORE_EVENT));
};

export type PushEntryInput = {
  inputText: string;
  sourceUrl: string;
  inputMode: DetectionInputMode;
  verdict: string;
  riskLevel: string;
  finalScore: number | null;
};

const generateId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `det-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const sanitizeExcerpt = (text: string) =>
  text.trim().replace(/\s+/g, " ").slice(0, EXCERPT_LIMIT);

export function useDetectionHistory() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const pushEntry = useCallback((input: PushEntryInput) => {
    const next: DetectionHistoryEntry = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      inputExcerpt: sanitizeExcerpt(input.inputText),
      sourceUrl: input.sourceUrl.trim(),
      inputMode: input.inputMode,
      verdict: input.verdict,
      riskLevel: input.riskLevel,
      finalScore: input.finalScore,
    };

    const current = readEntries();
    const merged = [next, ...current].slice(0, MAX_ENTRIES);
    persist(merged);
  }, []);

  const removeEntry = useCallback((id: string) => {
    const current = readEntries();
    const filtered = current.filter((entry) => entry.id !== id);
    persist(filtered);
  }, []);

  const clear = useCallback(() => {
    persist([]);
  }, []);

  return { entries, pushEntry, removeEntry, clear };
}

export const DETECTION_HISTORY_LIMIT = MAX_ENTRIES;
