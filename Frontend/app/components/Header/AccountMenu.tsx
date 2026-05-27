import Link from "next/link";
import type { RefObject } from "react";
import type { Session } from "next-auth";
import { LogOut } from "../ui/icons";

interface AccountMenuProps {
  accountMenuRef: RefObject<HTMLDivElement | null>;
  avatarInitial: string;
  isLoadingUser: boolean;
  isLoggingOut: boolean;
  isMenuOpen: boolean;
  user: Session["user"] | null;
  onLogoutRequest: () => void;
  onToggleMenu: () => void;
}

export default function AccountMenu({
  accountMenuRef,
  avatarInitial,
  isLoadingUser,
  isLoggingOut,
  isMenuOpen,
  user,
  onLogoutRequest,
  onToggleMenu,
}: AccountMenuProps) {
  if (isLoadingUser) {
    return (
      <div
        className="h-9 w-9 rounded-full bg-(--surface-deep) animate-pulse"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="hidden md:inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-(--muted-foreground) transition-colors hover:bg-(--surface-hover) hover:text-foreground sm:text-sm"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="hidden md:inline-flex items-center rounded-full bg-(--ink) px-4 py-2 text-xs font-semibold text-(--ink-foreground) shadow-[0_12px_24px_rgba(26,18,8,0.22)] transition-colors hover:bg-(--accent) sm:px-5 sm:text-sm"
        >
          Get started
        </Link>
      </>
    );
  }

  return (
    <div className="relative" ref={accountMenuRef}>
      <button
        type="button"
        onClick={onToggleMenu}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-(--ink) text-sm font-semibold text-(--ink-foreground) shadow-[0_10px_22px_rgba(23,17,10,0.25)] transition-colors hover:bg-(--accent)"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
        title="Account settings"
      >
        {avatarInitial}
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-2xl border border-(--line) bg-(--surface-strong) py-2 text-sm shadow-[0_20px_40px_rgba(20,16,8,0.14)]">
          <Link
            href="/settings"
            className="block px-4 py-2 text-(--muted-foreground) hover:bg-(--surface-hover)"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={onLogoutRequest}
            disabled={isLoggingOut}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left transition-colors ${
              isLoggingOut
                ? "cursor-not-allowed text-(--muted-foreground)/70"
                : "text-(--muted-foreground) hover:bg-(--surface-hover)"
            }`}
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
