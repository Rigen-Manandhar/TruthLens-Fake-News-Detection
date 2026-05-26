import Link from "next/link";

import Footer from "../components/Footer";

const privacyHighlights = [
  {
    title: "Account preferences",
    body: "TruthLens stores the settings needed to remember your preferred country, news categories, and risk-assessment defaults.",
  },
  {
    title: "Security controls",
    body: "Authentication, session handling, and account protection data are used to keep access secure and support features like password changes and session revocation.",
  },
  {
    title: "Feedback and product signals",
    body: "If you submit assessment feedback or use product forms, that information can be stored so the platform can improve review quality and maintain an audit trail.",
  },
];

const privacyCommitments = [
  "You can export your account data from Settings when you need a copy of what is stored.",
  "Account deletion requests are soft-deleted first, then permanently removed after the retention window.",
  "TruthLens keeps personal data focused on account operation, preference storage, and platform security.",
  "Questions about privacy handling can be sent directly through the Contact page.",
];

export default function PrivacyPage() {
  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-36 right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main id="main-content" className="page-main space-y-10 sm:space-y-12">
        <section className="section-reveal rounded-4xl border border-(--line) bg-(--surface)/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] lg:items-end">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-(--muted-foreground-strong)">
                Privacy Policy
              </p>
              <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-(--foreground-strong) sm:text-[3.2rem]">
                Privacy built around product use, security, and user control.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-(--muted-foreground) sm:text-base">
                TruthLens collects only the information needed to operate the
                platform, personalize your experience, protect your account, and
                support the misinformation risk assessment workflow. This page summarizes
                what data is used and what control you have over it.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-(--line) bg-[linear-gradient(145deg,rgba(255,253,248,0.96),rgba(247,241,230,0.92))] p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-(--line) bg-(--surface-pill) px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--muted-foreground)">
                  Privacy at a glance
                </div>
                <ul className="space-y-3 text-sm leading-6 text-(--foreground)">
                  {privacyCommitments.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-dashed border-(--line) bg-(--surface-strong) px-4 py-3"
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
          {privacyHighlights.map((item, index) => (
            <article
              key={item.title}
              className={`section-reveal rounded-[1.75rem] border border-(--line) bg-(--surface)/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] ${
                index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
                Category {index + 1}
              </p>
              <h2 className="mt-3 page-title display-title text-2xl font-bold text-(--foreground-strong)">
                {item.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">
                {item.body}
              </p>
            </article>
          ))}
        </section>

        <section className="section-reveal delay-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <article className="rounded-4xl border border-(--line) bg-(--surface-deep)/92 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
              Your controls
            </p>
            <h2 className="mt-3 page-title display-title text-3xl font-bold text-(--foreground-strong)">
              Manage your data from inside the product.
            </h2>
            <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">
              TruthLens gives signed-in users direct controls over important
              account data. You can review and update preferences, export your
              stored account information, and request account deletion through
              the settings experience.
            </p>
            <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">
              Deletion requests are handled in stages so accidental removal can
              be prevented and retention policies can still be honored before
              permanent erasure.
            </p>
          </article>

          <article className="rounded-4xl border border-(--line) bg-(--surface)/88 p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--muted-foreground-strong)">
              Need help?
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
                <h3 className="text-lg font-semibold text-(--foreground-strong)">
                  Contact the project inbox
                </h3>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
                  Use the Contact page if you want to ask about data handling,
                  deletion, exports, or account privacy concerns.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--foreground-strong) hover:text-(--accent)"
                >
                  Open contact page
                  <span aria-hidden="true">-&gt;</span>
                </Link>
              </div>

              <div className="rounded-3xl border border-(--line) bg-(--surface-strong) p-4">
                <h3 className="text-lg font-semibold text-(--foreground-strong)">
                  Review account settings
                </h3>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground)">
                  Signed-in users can manage preferences, account actions, and
                  privacy-related controls from the settings area.
                </p>
                <Link
                  href="/settings"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--foreground-strong) hover:text-(--accent)"
                >
                  Open settings
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
