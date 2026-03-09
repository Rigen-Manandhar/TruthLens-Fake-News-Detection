import Link from "next/link";

import Footer from "../components/Footer";

const principles = [
  {
    title: "Signal before noise",
    body:
      "We surface source quality, model confidence, and article context together so readers can judge a story with more than just a headline.",
  },
  {
    title: "Human judgment stays central",
    body:
      "TruthLens is built to support better reading decisions, not replace them. The platform shows evidence, uncertainty, and tradeoffs instead of pretending every answer is absolute.",
  },
  {
    title: "Fast enough for real news cycles",
    body:
      "The product blends live headlines, source credibility checks, and explainable AI outputs into a workflow that stays useful when stories are still moving.",
  },
];

const capabilities = [
  "Live news briefings with credibility signals attached to each story.",
  "Fake-news detection that combines source checks, headline analysis, and article-level model scoring.",
  "Explainable outputs that highlight the phrases influencing the model when deeper review is needed.",
  "A cleaner reading flow designed for quick scanning on desktop and mobile.",
];

export default function AboutPage() {
  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[9rem] right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main space-y-10 sm:space-y-12">
        <section className="section-reveal rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#867a6a]">
                About TruthLens
              </p>
              <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-[#17130f] sm:text-[3.2rem]">
                Built to help readers move from reaction to verification.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
                TruthLens is a news credibility platform created around a simple
                idea: when information moves fast, readers need clearer signals,
                not more clutter. We combine live news discovery with
                explainable fake-news detection so users can inspect what they
                are reading with more context and less guesswork.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,253,248,0.96),rgba(247,241,230,0.92))] p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-[var(--line)] bg-[#f6efe3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5548]">
                  What the platform does
                </div>
                <ul className="space-y-3 text-sm leading-6 text-[#4f473c]">
                  {capabilities.map((item) => (
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
          {principles.map((principle, index) => (
            <article
              key={principle.title}
              className={`section-reveal rounded-[1.75rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] ${
                index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                Principle {index + 1}
              </p>
              <h2 className="mt-3 page-title display-title text-2xl font-bold text-[#17130f]">
                {principle.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                {principle.body}
              </p>
            </article>
          ))}
        </section>

        <section className="section-reveal delay-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <article className="rounded-[2rem] border border-[var(--line)] bg-[#f7f1e6]/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
              Why it exists
            </p>
            <h2 className="mt-3 page-title display-title text-3xl font-bold text-[#17130f]">
              A final-year project focused on credible reading workflows.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5f5548]">
              TruthLens was developed as a Final Year Project centered on fake
              news detection. The goal was not just to classify text, but to
              build a usable product around that intelligence: a place where
              current headlines, source trust, and model explanations can work
              together in one interface.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5f5548]">
              That is why the product is split between a live news experience, a
              FastAPI-powered detection service, and an explainable UI layer that
              exposes uncertainty instead of hiding it.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[var(--line)] bg-[#fffdfa]/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
              Explore
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                <h3 className="text-lg font-semibold text-[#17130f]">
                  Read the live briefings
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Browse current headlines and inspect their credibility signals
                  in the main news feed.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
                >
                  Open news feed
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-4">
                <h3 className="text-lg font-semibold text-[#17130f]">
                  Run a detection check
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Paste text or a URL into the detection workflow to inspect the
                  verdict, confidence, and explanation output.
                </p>
                <Link
                  href="/fake-detection"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17130f] hover:text-[var(--accent)]"
                >
                  Open fake news detection
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
