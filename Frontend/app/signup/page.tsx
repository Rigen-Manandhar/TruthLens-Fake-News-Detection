import SignupForm from "../components/Auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -left-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <section className="space-y-6 auth-appear">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-[var(--muted-foreground)] uppercase shadow-[0_8px_20px_rgba(20,16,8,0.06)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Get started
            </div>
            <h1 className="display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Create your TruthLens account
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-md">
              Personalise your news experience, save interesting stories, and
              tap into AI-powered media verification.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Smart feed
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Curate topics you trust and follow the latest signals.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Saved insights
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Keep a history of verified articles and checks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[#12100d]/45" />
              Choose email or Google and start in seconds.
            </div>
          </section>

          <SignupForm />
        </div>
      </main>
    </div>
  );
}
