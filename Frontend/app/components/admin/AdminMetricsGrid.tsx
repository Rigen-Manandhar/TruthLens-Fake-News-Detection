type MetricCard = {
  label: string;
  value: number;
  tone: string;
};

type AdminMetricsGridProps = {
  metricCards: MetricCard[];
};

export default function AdminMetricsGrid({ metricCards }: AdminMetricsGridProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((card) => (
        <article
          key={card.label}
          className={`section-reveal rounded-[1.75rem] border border-[var(--line)] ${card.tone} p-6 shadow-[0_18px_36px_rgba(24,16,8,0.08)]`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#867a6a]">
            {card.label}
          </p>
          <p className="mt-4 page-title display-title text-4xl font-bold text-[#17130f]">
            {card.value}
          </p>
        </article>
      ))}
    </section>
  );
}
