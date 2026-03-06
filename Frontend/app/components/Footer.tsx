export default function Footer() {
  return (
    <footer className="mt-16 rounded-[2rem] border border-[var(--line)] bg-[#fffdf8]/90 px-6 py-8 shadow-[0_14px_34px_rgba(20,16,8,0.08)]">
      <div className="flex flex-col gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <div className="display-title text-xl font-bold text-[#17130f]">TruthLens</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#736759] sm:justify-start">
          <span className="cursor-default transition-colors hover:text-[#12100d]">About</span>
          <span className="cursor-default transition-colors hover:text-[#12100d]">Contact</span>
          <span className="cursor-default transition-colors hover:text-[#12100d]">Privacy</span>
          <span className="cursor-default transition-colors hover:text-[#12100d]">Terms</span>
        </div>
        <div className="text-xs text-[#8a7d6d]">
          (c) {new Date().getFullYear()} TruthLens Media
        </div>
      </div>
    </footer>
  );
}
