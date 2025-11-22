"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./ui/Logo";

export default function Header() {
  const pathname = usePathname();
  const isNews = pathname === "/" || pathname === "";
  const isFake = pathname?.startsWith("/fake-detection");

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3 flex-shrink-0">
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
        <nav className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
        </nav>
      </div>
    </header>
  );
}
