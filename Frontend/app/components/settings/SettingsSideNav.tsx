"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, type LucideIcon } from "lucide-react";

export type SettingsNavItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

interface SettingsSideNavProps {
  items: SettingsNavItem[];
}

export default function SettingsSideNav({ items }: SettingsSideNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) {
      return;
    }

    // IntersectionObserver wakes up whenever a section's top crosses the
    // top viewport offset; we pick whichever section currently has the
    // largest intersection ratio as the "active" one for nav highlighting.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const next = visible[0];
        if (next?.target?.id) {
          setActiveId(next.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
      }
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [items]);

  const navLinkClass = (active: boolean, mobile = false) =>
    `flex items-center gap-2 rounded-full ${mobile ? "px-3 py-1.5" : "px-3 py-2"} text-xs font-semibold transition-colors ${
      active
        ? "bg-(--ink) text-(--ink-foreground)"
        : "text-(--muted-foreground-strong) hover:bg-(--surface-hover) hover:text-(--foreground-strong)"
    }`;

  return (
    <>
      {/* Mobile / tablet: horizontal scroll-tabs */}
      <nav
        aria-label="Settings sections"
        className="lg:hidden -mx-1 overflow-x-auto"
      >
        <ul className="flex min-w-max items-center gap-1.5 px-1 pb-2">
          {items.map(({ id, label, Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={navLinkClass(activeId === id, true)}
              >
                <Icon aria-hidden className="h-3.5 w-3.5" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop: sticky sidebar */}
      <aside
        aria-label="Settings sections"
        className="hidden lg:block lg:sticky lg:top-24 lg:self-start"
      >
        <ul className="space-y-1 rounded-2xl border border-(--line) bg-(--surface)/80 p-2 shadow-[0_8px_24px_rgba(24,16,8,0.06)]">
          {items.map(({ id, label, Icon }) => (
            <li key={id}>
              <a href={`#${id}`} className={navLinkClass(activeId === id)}>
                <Icon aria-hidden className="h-4 w-4" />
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 px-3 text-[11px] text-(--muted-foreground)">
          <Sparkles aria-hidden className="h-3 w-3" />
          Settings auto-save when you click their save buttons.
        </p>
      </aside>
    </>
  );
}
