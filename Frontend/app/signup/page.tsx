import SignupForm from "../components/Auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen pt-20 bg-[radial-gradient(120%_120%_at_0%_0%,#f8fafc_0%,#ffffff_55%,#f1f5f9_100%)] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-100 via-white to-sky-100 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-amber-100 via-white to-emerald-100 blur-3xl opacity-70" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <section className="space-y-6 auth-appear">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-gray-500 uppercase shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-500/70" />
              Get started
            </div>
            <h1 className="text-3xl sm:text-[2.4rem] font-semibold text-gray-900 leading-tight tracking-tight">
              Create your TruthLens account
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-md">
              Personalise your news experience, save interesting stories, and
              tap into AI-powered media verification.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Smart feed
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Curate topics you trust and follow the latest signals.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Saved insights
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Keep a history of verified articles and checks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-900/30" />
              Choose email or Google and start in seconds.
            </div>
          </section>

          <SignupForm />
        </div>
      </main>
    </div>
  );
}
