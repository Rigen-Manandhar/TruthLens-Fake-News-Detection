import Link from "next/link";
import type { RefObject } from "react";
import { MAIN_NAV_ITEMS, type NavIndicator, type NavKey } from "./navConfig";

interface DesktopNavProps {
  activeNavKey: NavKey | null;
  isAdmin: boolean;
  navIndicator: NavIndicator;
  reducedMotion: boolean;
  navRef: RefObject<HTMLElement | null>;
  itemRefs: RefObject<Record<NavKey, HTMLAnchorElement | null>>;
}

export default function DesktopNav({
  activeNavKey,
  isAdmin,
  navIndicator,
  reducedMotion,
  navRef,
  itemRefs,
}: DesktopNavProps) {
  const desktopNavLinkClass = (active: boolean) =>
    `relative z-10 rounded-full px-4 py-1.5 transition-colors duration-300 ease-out ${
      active ? "text-(--ink-foreground) font-semibold" : "hover:text-foreground"
    }`;

  return (
    <nav
      ref={navRef}
      className="relative hidden md:flex items-center justify-center gap-2 rounded-full border border-(--line) bg-(--surface)/60 p-1 text-sm text-(--muted-foreground) shadow-[0_10px_30px_rgba(22,16,8,0.06)]"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-(--ink) shadow-[0_8px_18px_rgba(18,16,13,0.18)] ${
          navIndicator.animated && !reducedMotion
            ? "transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0.24,1)]"
            : ""
        }`}
        style={{
          left: 0,
          top: 0,
          width: navIndicator.width,
          height: navIndicator.height,
          transform: `translate3d(${navIndicator.left}px, ${navIndicator.top}px, 0)`,
          opacity: navIndicator.visible ? 1 : 0,
          visibility: navIndicator.visible ? "visible" : "hidden",
        }}
      />
      {MAIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
        (item) => (
          <Link
            key={item.key}
            ref={(el) => {
              itemRefs.current[item.key] = el;
            }}
            href={item.href}
            className={desktopNavLinkClass(activeNavKey === item.key)}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
