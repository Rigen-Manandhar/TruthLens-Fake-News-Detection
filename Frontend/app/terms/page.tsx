export default function TermsPage() {
  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden">
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[var(--muted-foreground)] uppercase">
            Legal
          </p>
          <h1 className="display-title text-4xl font-bold text-[#17130f]">Terms of Service</h1>
        </header>

        <section className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-6 space-y-3 text-sm text-[var(--muted-foreground)]">
          <p>
            TruthLens provides credibility signals and fake-news analysis to support informed
            reading decisions.
          </p>
          <p>
            You are responsible for your account security and for complying with applicable laws
            when submitting text or links for analysis.
          </p>
          <p>
            Questions about these terms can be sent to{" "}
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
