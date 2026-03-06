export default function PrivacyPage() {
  return (
    <div className="page-shell ambient-grid">
      <main className="page-main page-main--narrow space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[var(--muted-foreground)] uppercase">
            Legal
          </p>
          <h1 className="page-title display-title text-4xl font-bold text-[#17130f]">Privacy Policy</h1>
        </header>

        <section className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 space-y-3 text-sm text-[var(--muted-foreground)] break-words">
          <p>
            TruthLens uses your account data to provide personalized news defaults, security
            protections, and detection preferences.
          </p>
          <p>
            You can request a JSON export or schedule account deletion from Settings at any time.
            Deletion requests are soft-deleted first and permanently removed after the retention
            window.
          </p>
          <p>
            For policy questions, contact{" "}
            <a className="font-semibold text-[#17130f] hover:text-[var(--accent)]" href="mailto:support@truthlens.app">
              support@truthlens.app
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
