import Link from "next/link";

import Footer from "../components/Footer";

const termsHighlights = [
  {
    title: "Informational use",
    body:
      "TruthLens provides credibility signals, detection scores, and supporting context to help users evaluate news content more carefully.",
  },
  {
    title: "Responsible submission",
    body:
      "Users are responsible for the text, URLs, and other content they submit through the platform and for complying with applicable laws when using the service.",
  },
  {
    title: "Account responsibility",
    body:
      "If you create an account, you are responsible for keeping your login credentials secure and for activity that happens through your authenticated access.",
  },
];

const termsCommitments = [
  "TruthLens is designed to support informed review, not to guarantee that every output is fully accurate or final.",
  "Users should apply judgment when acting on credibility scores, explanations, or article classifications.",
  "Platform misuse, unlawful use, or abuse of account and API features may result in access restrictions.",
  "Questions about these terms can be directed through the Contact page.",
];

export default function TermsPage() {
  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[9rem] right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main space-y-10 sm:space-y-12">
        <section className="section-reveal rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] lg:items-end">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#867a6a]">
                Terms of Service
              </p>
              <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-[#17130f] sm:text-[3.2rem]">
                Terms built around fair use, informed judgment, and account responsibility.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
                TruthLens offers live news briefings, credibility indicators,
                and fake-news detection tools to support better reading
                decisions. These terms explain the basic expectations that apply
                when you use the platform.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,253,248,0.96),rgba(247,241,230,0.92))] p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5548]">
                  Terms at a glance
                </div>
                <ul className="space-y-3 text-sm leading-6 text-[#4f473c]">
                  {termsCommitments.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fffdf8] px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {termsHighlights.map((item, index) => (
            <article
              key={item.title}
              className={`section-reveal rounded-[1.75rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] ${
                index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                Term {index + 1}
              </p>
              <h2 className="mt-3 page-title display-title text-2xl font-bold text-[#17130f]">
                {item.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                {item.body}
              </p>
            </article>
          ))}
        </section>

        <section className="section-reveal delay-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <article className="rounded-[2rem] border border-[var(--line)] bg-[#f7f1e6]/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
              Important limitation
            </p>
            <h2 className="mt-3 page-title display-title text-3xl font-bold text-[#17130f]">
              Credibility outputs support decisions, but they are not guarantees.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5f5548]">
              TruthLens combines source credibility, model scoring, and
              explanation layers to provide useful signals. Those results are
              intended to assist analysis, not to serve as legal, professional,
              or fully definitive judgment.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5f5548]">
              Users remain responsible for how they interpret and act on the
              information shown inside the product.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
              Need help?
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                <h3 className="text-lg font-semibold text-[#17130f]">
                  Contact the project inbox
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Use the Contact page if you want to ask about service terms,
                  permitted use, account access, or platform restrictions.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
                >
                  Open contact page
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                <h3 className="text-lg font-semibold text-[#17130f]">
                  Review privacy terms too
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  For details on stored data, account controls, and deletion
                  handling, review the Privacy page alongside these terms.
                </p>
                <Link
                  href="/privacy"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
                >
                  Open privacy page
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              </div>
            </div>
          </article>
        </section>

        <Footer />
      </main>
    </div>
  );
}
