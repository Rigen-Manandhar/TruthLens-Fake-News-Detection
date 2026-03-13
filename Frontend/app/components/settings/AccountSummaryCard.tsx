import type { AccountProfile } from "./types";

type AccountSummaryCardProps = {
  profile: AccountProfile | null;
  providerLabel: string;
  reauthLabel: string;
};

export default function AccountSummaryCard({
  profile,
  providerLabel,
  reauthLabel,
}: AccountSummaryCardProps) {
  return (
    <section className="rounded-3xl bg-[#fffdfa]/90 border border-[var(--line)] p-5 sm:p-6 break-words">
      <p className="text-sm font-semibold text-[#17130f] break-words">{profile?.name}</p>
      <p className="text-xs text-[var(--muted-foreground)] break-all">{profile?.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(profile?.providerInfo.providers ?? []).map((provider) => (
          <span
            key={provider}
            className="rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]"
          >
            {provider}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-[var(--muted-foreground)]">{providerLabel}</div>
      <div className="mt-3 text-xs text-[var(--muted-foreground)]">{reauthLabel}</div>
    </section>
  );
}
