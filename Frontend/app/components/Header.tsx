"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Logo from "./ui/Logo";
import ConfirmDialog from "./ui/ConfirmDialog";

export default function Header() {
  const pathname = usePathname();
  const isNews = pathname === "/" || pathname === "";
  const isFake = pathname?.startsWith("/fake-detection");
  const isAdminPage = pathname?.startsWith("/admin");
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";
  const isLoadingUser = status === "loading";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen && !isMobileNavOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }

      if (
        isMobileNavOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isMobileNavOpen]);

  useEffect(() => {
    if (!isMenuOpen && !isMobileNavOpen && !isLogoutOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsMenuOpen(false);
      setIsMobileNavOpen(false);
      if (!isLoggingOut) {
        setIsLogoutOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoggingOut, isLogoutOpen, isMenuOpen, isMobileNavOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut({ redirect: false });
      setIsMenuOpen(false);
      setIsMobileNavOpen(false);
      setIsLogoutOpen(false);
      toast.success("You have been logged out.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutRequest = () => {
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    setIsLogoutOpen(true);
  };

  const handleLogoutCancel = () => {
    if (isLoggingOut) {
      return;
    }
    setIsLogoutOpen(false);
  };

  const rawInitial =
    user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? "U";
  const avatarInitial = rawInitial.toUpperCase();

  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 transition-all ${
      active ? "bg-[#12100d] text-[#f7f1e6] font-semibold" : "hover:text-[#12100d]"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-[#f7f1e6]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 xl:max-w-7xl">
        <div className="min-w-0 flex items-center gap-3">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/60 p-1 text-sm text-[var(--muted-foreground)] shadow-[0_10px_30px_rgba(22,16,8,0.06)]">
          <Link href="/" className={navLinkClass(isNews)}>
            News
          </Link>
          <Link href="/fake-detection" className={navLinkClass(Boolean(isFake))}>
            Fake News Detection
          </Link>
          {isAdmin && (
            <Link href="/admin" className={navLinkClass(Boolean(isAdminPage))}>
              Admin
            </Link>
          )}
        </nav>

        <nav className="flex items-center gap-2 sm:gap-3">
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[#fffdf8] text-[#17130f] shadow-[0_8px_20px_rgba(24,16,8,0.08)] transition-colors hover:bg-[#f4eee2]"
              aria-expanded={isMobileNavOpen}
              aria-haspopup="menu"
              aria-label="Toggle navigation menu"
            >
              <span className="flex flex-col gap-1">
                <span
                  className={`block h-0.5 w-4 rounded-full bg-current transition-transform ${
                    isMobileNavOpen ? "translate-y-1.5 rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 rounded-full bg-current transition-opacity ${
                    isMobileNavOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 rounded-full bg-current transition-transform ${
                    isMobileNavOpen ? "-translate-y-1.5 -rotate-45" : ""
                  }`}
                />
              </span>
            </button>

            {isMobileNavOpen && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-[var(--line)] bg-[#fffdf8] p-3 shadow-[0_20px_40px_rgba(20,16,8,0.14)]">
                <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
                  <Link href="/" className={`${navLinkClass(isNews)} text-center`}>
                    News
                  </Link>
                  <Link
                    href="/fake-detection"
                    className={`${navLinkClass(Boolean(isFake))} text-center`}
                  >
                    Fake News Detection
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`${navLinkClass(Boolean(isAdminPage))} text-center`}
                    >
                      Admin
                    </Link>
                  )}
                </div>
                {!isLoadingUser && !user && (
                  <div className="mt-3 grid gap-2 border-t border-[var(--line)] pt-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[#f4eee2] hover:text-[#12100d]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-full bg-[#12100d] px-4 py-2.5 text-sm font-semibold text-[#f7f1e6] shadow-[0_12px_24px_rgba(26,18,8,0.22)] transition-colors hover:bg-[var(--accent)]"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLoadingUser ? (
            <div
              className="h-9 w-9 rounded-full bg-[#e7dece] animate-pulse"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12100d] text-sm font-semibold text-[#f7f1e6] shadow-[0_10px_22px_rgba(23,17,10,0.25)] transition-colors hover:bg-[#0e7c66]"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                title="Account settings"
              >
                {avatarInitial}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--line)] bg-[#fffdf8] py-2 text-sm shadow-[0_20px_40px_rgba(20,16,8,0.14)]">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-[var(--muted-foreground)] hover:bg-[#f4eee2]"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogoutRequest}
                    disabled={isLoggingOut}
                    className={`block w-full px-4 py-2 text-left transition-colors ${
                      isLoggingOut
                        ? "cursor-not-allowed text-[#9f9382]"
                        : "text-[var(--muted-foreground)] hover:bg-[#f4eee2]"
                    }`}
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[#f4eee2] hover:text-[#12100d] sm:text-sm"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden md:inline-flex items-center rounded-full bg-[#12100d] px-4 py-2 text-xs font-semibold text-[#f7f1e6] shadow-[0_12px_24px_rgba(26,18,8,0.22)] transition-colors hover:bg-[var(--accent)] sm:px-5 sm:text-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
      <ConfirmDialog
        open={isLogoutOpen}
        title="Sign out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={handleLogoutCancel}
      />
    </header>
  );
}
