import Link from "next/link";
import type { RefObject } from "react";
import type { Session } from "next-auth";
import ThemeToggle from "../ui/ThemeToggle";
import { MAIN_NAV_ITEMS, type NavKey } from "./navConfig";

interface MobileNavProps {
  activeNavKey: NavKey | null;
  isAdmin: boolean;
  isLoadingUser: boolean;
  isOpen: boolean;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  user: Session["user"] | null;
  onToggle: () => void;
}

export default function MobileNav({
  activeNavKey,
  isAdmin,
  isLoadingUser,
  isOpen,
  mobileMenuRef,
  user,
  onToggle,
}: MobileNavProps) {
  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 transition-all ${
      active
        ? "bg-(--ink) text-(--ink-foreground) font-semibold"
        : "hover:text-foreground"
    }`;

  return (
    <div className="relative md:hidden" ref={mobileMenuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-(--foreground-strong) shadow-[0_8px_20px_rgba(24,16,8,0.08)] transition-colors hover:bg-(--surface-hover)"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Toggle navigation menu"
      >
        <span className="flex flex-col gap-1">
          <span
            className={`block h-0.5 w-4 rounded-full bg-current transition-transform ${
              isOpen ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-4 rounded-full bg-current transition-opacity ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-4 rounded-full bg-current transition-transform ${
              isOpen ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-(--line) bg-(--surface-strong) p-3 shadow-[0_20px_40px_rgba(20,16,8,0.14)]">
          <div className="grid gap-2 text-sm text-(--muted-foreground)">
            {MAIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
              (item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`${navLinkClass(activeNavKey === item.key)} text-center`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
          {!isLoadingUser && !user && (
            <div className="mt-3 grid gap-2 border-t border-(--line) pt-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-(--line) bg-(--surface) px-4 py-2.5 text-sm font-semibold text-(--muted-foreground) transition-colors hover:bg-(--surface-hover) hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-(--ink) px-4 py-2.5 text-sm font-semibold text-(--ink-foreground) shadow-[0_12px_24px_rgba(26,18,8,0.22)] transition-colors hover:bg-(--accent)"
              >
                Get started
              </Link>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-(--line) pt-3">
            <span className="text-xs font-semibold text-(--muted-foreground-strong)">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
