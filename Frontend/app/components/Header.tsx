"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Logo from "./ui/Logo";

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
};

export default function Header() {
  const pathname = usePathname();
  const isNews = pathname === "/" || pathname === "";
  const isFake = pathname?.startsWith("/fake-detection");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);

  const loadUser = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingUser(true);
    }

    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!isMountedRef.current) {
        return;
      }

      setUser(data?.user ?? null);
    } catch {
      if (isMountedRef.current) {
        setUser(null);
      }
    } finally {
      if (showLoading && isMountedRef.current) {
        setIsLoadingUser(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadUser(true);
    return () => {
      isMountedRef.current = false;
    };
  }, [loadUser]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleAuthChanged = () => {
      loadUser(false);
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [loadUser]);

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
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "Logout failed. Please try again.");
        return;
      }

      setUser(null);
      setIsMenuOpen(false);
      window.dispatchEvent(new Event("auth-changed"));
      toast.success("You have been logged out.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const rawInitial =
    user?.fullName?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? "U";
  const avatarInitial = rawInitial.toUpperCase();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-sm text-gray-600">
          <Link
            href="/"
            className={`transition-colors ${
              isNews ? "font-semibold text-gray-900" : "hover:text-gray-900"
            }`}
          >
            News
          </Link>
          <Link
            href="/fake-detection"
            className={`transition-colors ${
              isFake ? "font-semibold text-gray-900" : "hover:text-gray-900"
            }`}
          >
            Fake News Detection
          </Link>
        </nav>

        {/* Auth actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {isLoadingUser ? (
            <div
              className="h-9 w-9 rounded-full bg-gray-100 animate-pulse"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="h-9 w-9 rounded-full bg-gray-900 text-white text-sm font-semibold flex items-center justify-center shadow-sm hover:bg-black transition-colors"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                title="Account settings"
              >
                {avatarInitial}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-100 bg-white shadow-lg py-2 text-sm">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`block w-full px-4 py-2 text-left transition-colors ${
                      isLoggingOut
                        ? "cursor-not-allowed text-gray-400"
                        : "text-gray-700 hover:bg-gray-50"
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
                className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full bg-gray-900 text-white text-xs sm:text-sm font-semibold hover:bg-black transition-colors shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
