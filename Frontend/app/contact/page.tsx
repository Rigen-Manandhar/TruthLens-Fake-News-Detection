"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import Footer from "../components/Footer";

type ContactStatus = {
  type: "success" | "error";
  message: string;
} | null;

const initialForm = {
  name: "",
  email: "",
  message: "",
};

export default function ContactPage() {
  const { data: session, status: authStatus } = useSession();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ContactStatus>(null);
  const sessionEmail = session?.user?.email?.trim() ?? "";
  const useAccountEmail = Boolean(sessionEmail);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const payload = {
      name: form.name.trim(),
      email: useAccountEmail ? sessionEmail : form.email.trim(),
      message: form.message.trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus({
        type: "error",
        message: "Name, email, and message are all required.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to send message.");
      }

      setForm(initialForm);
      setStatus({
        type: "success",
        message: data?.message ?? "Your message was sent successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell ambient-grid flex flex-col">
      <div className="pointer-events-none absolute -top-12 -left-10 h-56 w-56 rounded-full bg-[rgba(232,176,116,0.28)] blur-3xl" />
      <div className="pointer-events-none absolute top-[9rem] right-0 h-72 w-72 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <div className="flex min-h-[calc(100vh-5.5rem)] flex-1 flex-col sm:min-h-[calc(100vh-5.75rem)]">
        <main className="page-main flex flex-1 flex-col justify-center">
          <section className="section-reveal rounded-[2.2rem] border border-[var(--line)] bg-[#fffdfa]/88 px-6 py-8 shadow-[0_22px_46px_rgba(24,16,8,0.1)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(29rem,0.88fr)] lg:items-center xl:gap-10">
              <div className="space-y-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#867a6a]">
                Contact TruthLens
              </p>
              <h1 className="page-title display-title max-w-3xl text-4xl font-bold text-[#17130f] sm:text-[3.35rem] lg:text-[3.9rem]">
                Send a message without leaving the product.
              </h1>
              <p className="max-w-2xl text-sm leading-8 text-[var(--muted-foreground)] sm:text-base">
                Use this form for project questions, collaboration requests,
                bug reports, or feedback about the credibility workflow. Messages
                submitted here are sent directly to the TruthLens inbox.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.5rem] border border-[var(--line)] bg-[#f7f1e6]/92 p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                    Inbox
                  </p>
                  <p className="mt-3 break-words text-base font-semibold text-[#17130f]">
                    rigenmanandharrm@gmail.com
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5f5548]">
                    Every submission from this page is routed to this address.
                  </p>
                </article>

                <article className="rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] p-5 shadow-[0_16px_32px_rgba(24,16,8,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
                    Best for
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#5f5548]">
                    Feature feedback, integration questions, project inquiries,
                    and issues affecting the news feed or detection flow.
                  </p>
                </article>
              </div>

              <div className="rounded-[1.6rem] border border-dashed border-[var(--line)] bg-[linear-gradient(135deg,rgba(14,124,102,0.08),rgba(232,176,116,0.12))] px-5 py-4 text-sm leading-7 text-[#4f473c] shadow-[0_14px_28px_rgba(24,16,8,0.05)]">
                Messages from this form go directly to the TruthLens inbox, and{" "}
                {useAccountEmail
                  ? "your signed-in account email is used as the reply target."
                  : "your entered email address is used as the reply target."}
              </div>
            </div>

            <section className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,253,248,0.98),rgba(247,241,230,0.92))] p-5 shadow-[0_18px_36px_rgba(24,16,8,0.1)] sm:p-6 lg:p-7">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="contact-name"
                    className="text-sm font-semibold text-[#17130f]"
                  >
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#948777] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
                    placeholder="What should we call you?"
                    maxLength={80}
                    disabled={isSubmitting}
                  />
                </div>

                {useAccountEmail ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#17130f]">
                      Reply email
                    </label>
                    <div className="rounded-2xl border border-[var(--line)] bg-[#eef6f3] px-4 py-3 text-sm text-[#0b5b4d]">
                      <div className="font-semibold">Signed in as</div>
                      <div className="mt-1 break-words">{sessionEmail}</div>
                    </div>
                  </div>
                ) : authStatus === "loading" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#17130f]">
                      Reply email
                    </label>
                    <div
                      className="h-[3.125rem] rounded-2xl border border-[var(--line)] bg-[#f6efe3] animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-email"
                      className="text-sm font-semibold text-[#17130f]"
                    >
                      Your email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className="w-full rounded-2xl border border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#948777] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
                      placeholder="Where should replies go?"
                      maxLength={120}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-semibold text-[#17130f]"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    className="min-h-40 w-full rounded-[1.5rem] border border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#948777] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45"
                    placeholder="Write what you want to send..."
                    maxLength={3000}
                    disabled={isSubmitting}
                  />
                </div>

                {status && (
                  <p
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      status.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {status.message}
                  </p>
                )}

                <div className="flex flex-col gap-4 border-t border-[var(--line)]/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-[#7f7364]">
                    Submitted messages are sent to the TruthLens contact inbox
                    with{" "}
                    {useAccountEmail
                      ? "your account email attached as the reply-to address."
                      : "your email attached as the reply-to address."}
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#12100d] px-7 text-sm font-semibold whitespace-nowrap text-[#f7f1e6] shadow-[0_12px_24px_rgba(24,16,8,0.2)] transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[10.5rem]"
                  >
                    {isSubmitting ? "Sending..." : "Send message"}
                  </button>
                </div>
              </form>
            </section>
            </div>
          </section>
        </main>

        <div className="page-main pt-0">
          <Footer className="mt-0" />
        </div>
      </div>
    </div>
  );
}
