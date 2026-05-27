"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import AccountMenu from "./Header/AccountMenu";
import DesktopNav from "./Header/DesktopNav";
import MobileNav from "./Header/MobileNav";
import { INITIAL_INDICATOR, type NavIndicator, type NavKey } from "./Header/navConfig";
import Logo from "./ui/Logo";
import ConfirmDialog from "./ui/ConfirmDialog";
import ThemeToggle from "./ui/ThemeToggle";
import { useReducedMotion } from "./ui/useReducedMotion";

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

      if (linkRect.width === 0 && linkRect.height === 0) {
        return;
      }

      setNavIndicator({
        left: linkRect.left - containerRect.left - container.clientLeft,
        top: linkRect.top - containerRect.top - container.clientTop,
        width: linkRect.width,
        height: linkRect.height,
        visible: true,
        animated: hasMeasuredIndicatorRef.current,
      });
      hasMeasuredIndicatorRef.current = true;
    };

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-(--line) bg-(--surface-deep)/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 xl:max-w-7xl">
        <div className="min-w-0 flex items-center gap-3">
          <Logo />
        </div>

        <DesktopNav
          activeNavKey={activeNavKey}
          isAdmin={isAdmin}
          navIndicator={navIndicator}
          reducedMotion={reducedMotion}
          navRef={desktopNavRef}
          itemRefs={desktopNavItemRefs}
        />

        <nav className="flex items-center gap-2 sm:gap-3">
          <MobileNav
            activeNavKey={activeNavKey}
            isAdmin={isAdmin}
            isLoadingUser={isLoadingUser}
            isOpen={isMobileNavOpen}
            mobileMenuRef={mobileMenuRef}
            user={user}
            onToggle={() => setIsMobileNavOpen((prev) => !prev)}
          />

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <AccountMenu
            accountMenuRef={accountMenuRef}
            avatarInitial={avatarInitial}
            isLoadingUser={isLoadingUser}
            isLoggingOut={isLoggingOut}
            isMenuOpen={isMenuOpen}
            user={user}
            onLogoutRequest={handleLogoutRequest}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
          />
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
