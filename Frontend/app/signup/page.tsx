import SignupForm from "../components/Auth/SignupForm";
import Footer from "../components/Footer";

export default function SignupPage() {
  return (
    <div className="page-shell ambient-grid flex flex-col">
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -left-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main flex-1 flex flex-col">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start lg:items-center">
          <section className="space-y-6 auth-appear">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
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

        <div className="mt-10 sm:mt-auto">
          <Footer />
        </div>
      </main>
    </div>
  );
}
