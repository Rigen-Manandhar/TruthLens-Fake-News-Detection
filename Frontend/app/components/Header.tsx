"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Logo from "./ui/Logo";
import ConfirmDialog from "./ui/ConfirmDialog";
import ThemeToggle from "./ui/ThemeToggle";
import { useReducedMotion } from "./ui/useReducedMotion";
import { LogOut } from "./ui/icons";

type NavKey = "news" | "fake" | "deepfake" | "admin";

type NavIndicator = {
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  animated: boolean;
};

const INITIAL_INDICATOR: NavIndicator = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  visible: false,
  animated: false,
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isNews = pathname === "/" || pathname === "";
  const isFake = pathname?.startsWith("/fake-detection");
  const isDeepfake = pathname?.startsWith("/deepfake-detection");
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
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const desktopNavItemRefs = useRef<Record<NavKey, HTMLAnchorElement | null>>({
    news: null,
    fake: null,
    deepfake: null,
    admin: null,
  });
  const hasMeasuredIndicatorRef = useRef(false);
  const [navIndicator, setNavIndicator] =
    useState<NavIndicator>(INITIAL_INDICATOR);
  const reducedMotion = useReducedMotion();

  const activeNavKey: NavKey | null = isNews
    ? "news"
    : isFake
      ? "fake"
      : isDeepfake
        ? "deepfake"
        : isAdminPage
          ? "admin"
          : null;

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

  // Position the sliding pill indicator under the active desktop nav item and
  // keep it in sync with route, admin visibility, and viewport changes.
  useEffect(() => {
    const container = desktopNavRef.current;
    if (!container) {
      return;
    }

    const measure = () => {
      if (!activeNavKey) {
        setNavIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }

      const link = desktopNavItemRefs.current[activeNavKey];
      if (!link) {
        return;
      }

      const linkRect = link.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Skip when the desktop nav is hidden (under md breakpoint) — we'd get
      // an all-zero rect that would collapse the indicator at (0,0).
      if (linkRect.width === 0 && linkRect.height === 0) {
        return;
      }

      setNavIndicator({
        left: linkRect.left - containerRect.left - container.clientLeft,
        top: linkRect.top - containerRect.top - container.clientTop,
        width: linkRect.width,
        height: linkRect.height,
        visible: true,
        // First-ever measurement should not animate from (0,0); only later
        // route changes should glide.
        animated: hasMeasuredIndicatorRef.current,
      });
      hasMeasuredIndicatorRef.current = true;
    };

    // Defer to the next frame so that newly-mounted links (e.g., Admin once
    // the session loads) have their layout settled before we measure.
    const initialFrame = requestAnimationFrame(measure);

    let resizeFrame: number | null = null;
    const onResize = () => {
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(initialFrame);
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [activeNavKey, isAdmin]);

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
      // Move off any auth-protected route and re-render the current page so
      // server components reflect the cleared session immediately.
      router.replace("/");
      router.refresh();
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

  const rawInitial = user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? "U";
  const avatarInitial = rawInitial.toUpperCase();

  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 transition-all ${
      active
        ? "bg-(--ink) text-(--ink-foreground) font-semibold"
        : "hover:text-(--foreground)"
    }`;

  // Desktop variant relies on the sliding indicator instead of a per-item pill,
  // so it only flips text colour and stacks above the indicator via z-index.
  const desktopNavLinkClass = (active: boolean) =>
    `relative z-10 rounded-full px-4 py-1.5 transition-colors duration-300 ease-out ${
      active
        ? "text-(--ink-foreground) font-semibold"
        : "hover:text-(--foreground)"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-(--line) bg-(--surface-deep)/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 xl:max-w-7xl">
        <div className="min-w-0 flex items-center gap-3">
          <Logo />
        </div>

        <nav
          ref={desktopNavRef}
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
              // Hide until measured so we don't paint a 0x0 nub at (0,0)
              // for one frame before the rect lands.
              visibility: navIndicator.visible ? "visible" : "hidden",
            }}
          />
          <Link
            ref={(el) => {
              desktopNavItemRefs.current.news = el;
            }}
            href="/"
            className={desktopNavLinkClass(isNews)}
          >
            News
          </Link>
          <Link
            ref={(el) => {
              desktopNavItemRefs.current.fake = el;
            }}
            href="/fake-detection"
            className={desktopNavLinkClass(Boolean(isFake))}
          >
            Risk Assessment
          </Link>
          <Link
            ref={(el) => {
              desktopNavItemRefs.current.deepfake = el;
            }}
            href="/deepfake-detection"
            className={desktopNavLinkClass(Boolean(isDeepfake))}
          >
            Deepfake
          </Link>
          {isAdmin && (
            <Link
              ref={(el) => {
                desktopNavItemRefs.current.admin = el;
              }}
              href="/admin"
              className={desktopNavLinkClass(Boolean(isAdminPage))}
            >
              Admin
            </Link>
          )}
        </nav>

        <nav className="flex items-center gap-2 sm:gap-3">
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-(--foreground-strong) shadow-[0_8px_20px_rgba(24,16,8,0.08)] transition-colors hover:bg-(--surface-hover)"
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
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-(--line) bg-(--surface-strong) p-3 shadow-[0_20px_40px_rgba(20,16,8,0.14)]">
                <div className="grid gap-2 text-sm text-(--muted-foreground)">
                  <Link
                    href="/"
                    className={`${navLinkClass(isNews)} text-center`}
                  >
                    News
                  </Link>
                  <Link
                    href="/fake-detection"
                    className={`${navLinkClass(Boolean(isFake))} text-center`}
                  >
                    Risk Assessment
                  </Link>
                  <Link
                    href="/deepfake-detection"
                    className={`${navLinkClass(Boolean(isDeepfake))} text-center`}
                  >
                    Deepfake
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

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {isLoadingUser ? (
            <div
              className="h-9 w-9 rounded-full bg-(--surface-deep) animate-pulse"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
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
                    onClick={handleLogoutRequest}
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
          ) : (
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
