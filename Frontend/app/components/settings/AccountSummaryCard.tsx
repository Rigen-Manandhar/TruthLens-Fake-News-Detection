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
    <section className="rounded-3xl bg-(--surface)/90 border border-(--line) p-5 sm:p-6 break-words">
      <p className="text-sm font-semibold text-(--foreground-strong) break-words">{profile?.name}</p>
      <p className="text-xs text-(--muted-foreground) break-all">{profile?.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(profile?.providerInfo.providers ?? []).map((provider) => (
          <span
            key={provider}
            className="rounded-full border border-(--line) bg-(--surface-strong) px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--muted-foreground)"
          >
            {provider}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-(--muted-foreground)">{providerLabel}</div>
      <div className="mt-3 text-xs text-(--muted-foreground)">{reauthLabel}</div>
    </section>
  );
}
