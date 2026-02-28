import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center">
      <span className="display-title text-2xl font-bold text-[#17130f] tracking-tight transition-colors group-hover:text-[#0e7c66]">
        TruthLens
      </span>
    </Link>
  );
}
