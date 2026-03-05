import LoginForm from "../components/Auth/LoginForm";
import Footer from "../components/Footer";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -right-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="relative max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 flex flex-col">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <section className="space-y-6 auth-appear">
            <h1 className="display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Sign in to TruthLens
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-md">
              Pick up where you left off. Access your saved articles, verify
              news stories, and keep your feed tailored to what matters to you.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Personalized
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Resume your tailored news briefing and saved reads.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Verified
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Jump back into AI-backed credibility insights.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[#12100d]/45" />
              Encrypted sessions with trusted providers.
            </div>
          </section>

          <LoginForm />
        </div>

        <div className="mt-auto">
          <Footer />
        </div>
      </main>
    </div>
  );
}
