"use client";

import Link from "next/link";

interface FooterProps {
  className?: string;
}

const productLinks = [
  { href: "/", label: "News" },
  { href: "/fake-detection", label: "Risk Assessment" },
  { href: "/deepfake-detection", label: "Deepfake" },
  { href: "/settings", label: "Settings" },
];

const resourceLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Footer({ className = "mt-16" }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`${className} rounded-4xl border border-(--line) bg-(--surface-strong)/90 px-6 py-8 shadow-[0_14px_34px_rgba(20,16,8,0.08)]`}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="display-title text-xl font-bold text-(--foreground-strong)">
            TruthLens
          </div>
          <p className="mt-2 max-w-sm text-xs leading-6 text-(--muted-foreground)">
            News credibility, with the uncertainty visible. A fact-checking
            support workflow, not an automated truth detector.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-(--muted-foreground)">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-(--foreground)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
            Resources
          </p>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-(--muted-foreground)">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-(--foreground)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-(--line)/70 pt-4 text-xs text-(--muted-foreground) sm:flex-row">
        <span>&copy; {year} TruthLens</span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-(--muted-foreground-strong)">
          Final Year Project
        </span>
      </div>
    </footer>
  );
}
