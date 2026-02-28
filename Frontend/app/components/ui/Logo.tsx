import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#12100d] text-[11px] font-extrabold tracking-[0.18em] text-[#f4eee3]">
        TL
      </span>
      <span className="display-title text-lg font-bold text-[#17130f] tracking-tight transition-colors group-hover:text-[#0e7c66]">
        TruthLens
      </span>
    </Link>
  );
}
