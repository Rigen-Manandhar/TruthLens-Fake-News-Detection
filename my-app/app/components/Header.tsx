import Link from "next/link";
import Logo from "./ui/Logo";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link
            href="/signup"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Signup
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-gray-900 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

