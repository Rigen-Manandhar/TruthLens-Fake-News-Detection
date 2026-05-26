"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "./icons";

type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "truthlens.theme";
const STORE_EVENT = "truthlens.theme:change";

const isThemeChoice = (value: unknown): value is ThemeChoice =>
  value === "system" || value === "light" || value === "dark";

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  // 'storage' fires for cross-tab updates; the custom event covers in-tab
  // updates so all ThemeToggle instances stay in sync without prop drilling.
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
};

const getSnapshot = (): ThemeChoice => {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
  } catch {
    /* localStorage unavailable — fall through. */
  }
  return "system";
};

const getServerSnapshot = (): ThemeChoice => "system";

const applyTheme = (resolved: "light" | "dark") => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.theme = resolved;
};

const persistChoice = (choice: ThemeChoice) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (choice === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    /* localStorage write may fail in private mode — silently ignore. */
  }
  window.dispatchEvent(new Event(STORE_EVENT));
};

const options: Array<{ value: ThemeChoice; Icon: typeof Sun; label: string }> = [
  { value: "system", Icon: Monitor, label: "Use system theme" },
  { value: "light", Icon: Sun, label: "Light theme" },
  { value: "dark", Icon: Moon, label: "Dark theme" },
];

export default function ThemeToggle() {
  // useSyncExternalStore handles SSR (returns "system") and client mount
  // (reads localStorage) without requiring useEffect+setState — which the
  // React 19 lint rule react-hooks/set-state-in-effect flags.
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-apply the resolved theme whenever the choice changes (or whenever the
  // OS preference changes while we're in 'system' mode).
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (choice === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches ? "dark" : "light");

      const handler = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    applyTheme(choice);
  }, [choice]);

  const handleSelect = useCallback((next: ThemeChoice) => {
    persistChoice(next);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-full border border-(--line) bg-(--surface) p-0.5 shadow-[0_4px_12px_rgba(24,16,8,0.06)]"
    >
      {options.map(({ value, Icon, label }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => handleSelect(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active
                ? "bg-(--ink) text-(--ink-foreground)"
                : "text-(--muted-foreground-strong) hover:text-(--foreground-strong)"
            }`}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export type { ThemeChoice };
export { isThemeChoice };
