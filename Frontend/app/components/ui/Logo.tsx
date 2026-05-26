import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center">
      <span className="display-title text-2xl font-bold text-(--foreground-strong) tracking-tight transition-colors group-hover:text-(--accent)">
        TruthLens
      </span>
    </Link>
  );
}
