import ResetPasswordForm from "../components/Auth/ResetPasswordForm";
import Footer from "../components/Footer";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <div className="page-shell ambient-grid flex flex-col">
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-32 -left-14 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main flex-1 flex flex-col">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start lg:items-center">
          <section className="space-y-6 auth-appear">
            <h1 className="page-title display-title text-4xl sm:text-[2.9rem] font-bold text-[#17130f] tracking-tight">
              Finish your TruthLens password reset
            </h1>
            <p className="text-sm sm:text-base text-(--muted-foreground) max-w-md">
              Set a new password to restore access. Once completed, existing sessions
              are invalidated and you&apos;ll sign in again with the updated password.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--line) bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Secure update
                </p>
                <p className="text-sm text-(--muted-foreground) mt-2">
                  Reset tokens are single-use and hashed before they are stored.
                </p>
              </div>
              <div className="rounded-2xl border border-(--line) bg-[#fffdf8]/90 px-4 py-4 shadow-[0_10px_20px_rgba(20,16,8,0.06)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#847868] uppercase">
                  Works for Google users
                </p>
                <p className="text-sm text-(--muted-foreground) mt-2">
                  Google-linked accounts can use this flow to create a password too.
                </p>
              </div>
            </div>
          </section>

          <ResetPasswordForm token={token?.trim() ?? ""} />
        </div>

        <div className="mt-10 sm:mt-auto">
          <Footer />
        </div>
      </main>
    </div>
  );
}
