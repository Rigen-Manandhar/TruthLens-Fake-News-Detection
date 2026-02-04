import LoginForm from "../components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-20 bg-[radial-gradient(120%_120%_at_0%_0%,#f8fafc_0%,#ffffff_55%,#f1f5f9_100%)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-sky-100 via-white to-emerald-100 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-amber-100 via-white to-sky-100 blur-3xl opacity-70" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <section className="space-y-6 auth-appear">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-gray-500 uppercase shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              Secure sign-in
            </div>
            <h1 className="text-3xl sm:text-[2.4rem] font-semibold text-gray-900 leading-tight tracking-tight">
              Sign in to TruthLens
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-md">
              Pick up where you left off. Access your saved articles, verify
              news stories, and keep your feed tailored to what matters to you.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Personalized
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Resume your tailored news briefing and saved reads.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Verified
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Jump back into AI-backed credibility insights.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-900/30" />
              Encrypted sessions with trusted providers.
            </div>
          </section>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
