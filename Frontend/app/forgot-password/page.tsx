import ForgotPasswordForm from "../components/Auth/ForgotPasswordForm";
import Footer from "../components/Footer";

export default function ForgotPasswordPage() {
  return (
    <div className="page-shell ambient-grid flex flex-col">
      <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[8rem] -right-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main flex-1 flex flex-col">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start lg:items-center">
          <section className="space-y-6 auth-appear">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Recover access to TruthLens
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-md">
              We&apos;ll send a secure reset link to your email so you can get back to
              your saved stories, personalized feed, and verification tools.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  One-time link
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Reset links expire after 30 minutes and can only be used once.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  TruthLens branded
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  The email is sent from TruthLens using your configured Gmail sender.
                </p>
              </div>
            </div>
          </section>

          <ForgotPasswordForm />
        </div>

        <div className="mt-10 sm:mt-auto">
          <Footer />
        </div>
      </main>
    </div>
  );
}
