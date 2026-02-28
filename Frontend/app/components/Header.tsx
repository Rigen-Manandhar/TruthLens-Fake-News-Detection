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
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isLoadingUser = status === "loading";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut({ redirect: false });
      setIsMenuOpen(false);
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

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--line)] bg-[#f7f1e6]/75 backdrop-blur-xl">
      <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        <nav className="hidden md:flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/60 p-1 text-sm text-[var(--muted-foreground)] shadow-[0_10px_30px_rgba(22,16,8,0.06)]">
          <Link
            href="/"
            className={`rounded-full px-4 py-1.5 transition-all ${
              isNews
                ? "bg-[#12100d] text-[#f7f1e6] font-semibold"
                : "hover:text-[#12100d]"
            }`}
          >
            News
          </Link>
          <Link
            href="/fake-detection"
            className={`rounded-full px-4 py-1.5 transition-all ${
              isFake
                ? "bg-[#12100d] text-[#f7f1e6] font-semibold"
                : "hover:text-[#12100d]"
            }`}
          >
            Fake News Detection
          </Link>
        </nav>

        <nav className="flex items-center gap-2 sm:gap-3">
          {isLoadingUser ? (
            <div
              className="h-9 w-9 rounded-full bg-[#e7dece] animate-pulse"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="h-9 w-9 rounded-full bg-[#12100d] text-[#f7f1e6] text-sm font-semibold flex items-center justify-center shadow-[0_10px_22px_rgba(23,17,10,0.25)] transition-colors hover:bg-[#0e7c66]"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                title="Account settings"
              >
                {avatarInitial}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[var(--line)] bg-[#fffdf8] shadow-[0_20px_40px_rgba(20,16,8,0.14)] py-2 text-sm">
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
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[var(--muted-foreground)] hover:text-[#12100d] hover:bg-[#f4eee2] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full bg-[#12100d] text-[#f7f1e6] text-xs sm:text-sm font-semibold hover:bg-[var(--accent)] transition-colors shadow-[0_12px_24px_rgba(26,18,8,0.22)]"
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
