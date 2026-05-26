"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, type LucideIcon } from "../ui/icons";

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

    const sectionEls = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    // Pick whichever observed section currently has the largest visible
    // intersection ratio, falling back to the closest section above the
    // top viewport offset when none are inside the active band — that way
    // the sidebar stays accurate even between very short / tall sections.
    const recompute = () => {
      const viewportTop = 96; // matches scroll-mt-24
      let bestVisible: { id: string; ratio: number } | null = null;
      let nearestAbove: { id: string; distance: number } | null = null;

      for (const el of sectionEls) {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.bottom > viewportTop && rect.top < window.innerHeight;
        if (isVisible) {
          // Approximate intersection ratio as fraction of element visible.
          const visibleHeight =
            Math.min(rect.bottom, window.innerHeight) -
            Math.max(rect.top, viewportTop);
          const ratio = Math.max(0, visibleHeight / Math.max(1, rect.height));
          if (!bestVisible || ratio > bestVisible.ratio) {
            bestVisible = { id: el.id, ratio };
          }
        } else if (rect.bottom <= viewportTop) {
          const distance = viewportTop - rect.bottom;
          if (!nearestAbove || distance < nearestAbove.distance) {
            nearestAbove = { id: el.id, distance };
          }
        }
      }

      const next =
        bestVisible?.id ?? nearestAbove?.id ?? sectionEls[0]?.id ?? null;
      if (next) {
        setActiveId(next);
      }
    };

    // Observer kicks recompute on entry/exit; the scroll listener handles
    // the gap between sections where no entry is currently intersecting.
    const observer = new IntersectionObserver(() => recompute(), {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    sectionEls.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    let scrollFrame: number | null = null;
    const onScroll = () => {
      if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
      }
      scrollFrame = requestAnimationFrame(recompute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Run once on mount so a deep-link / mid-page hydrate picks the right
    // active item without waiting for the first scroll event.
    recompute();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
      }
    };
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
                aria-current={activeId === id ? "true" : undefined}
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
              <a
                href={`#${id}`}
                aria-current={activeId === id ? "true" : undefined}
                className={navLinkClass(activeId === id)}
              >
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
