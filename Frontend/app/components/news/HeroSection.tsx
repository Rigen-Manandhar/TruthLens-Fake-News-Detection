import Image from "next/image";

import HeroImage from "../../Images/HeroImage.gif";

interface HeroSectionProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const quickTopics = [
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "general", label: "World" },
  { value: "science", label: "Science" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
];

export default function HeroSection({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  selectedCategory,
  onCategoryChange,
}: HeroSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <section className="mb-12 lg:mb-16 relative section-reveal">
      <div className="pointer-events-none absolute -top-8 left-0 h-44 w-44 rounded-full bg-[rgba(232,176,116,0.36)] blur-3xl" />
      <div className="pointer-events-none absolute top-4 right-16 h-36 w-36 rounded-full bg-[rgba(14,124,102,0.28)] blur-3xl" />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
        <span className="rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1.5">
          Powered by News API
        </span>
        <span className="rounded-full border border-[var(--line)] bg-[#fffdf8] px-3 py-1.5">
          AI credibility signal
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.26fr)_minmax(0,1fr)] items-center glass-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="section-reveal delay-1">
          <h1 className="display-title text-4xl sm:text-[3.35rem] lg:text-[3.8rem] font-bold leading-[0.96] text-[#17130f] mb-5">
            Read the day.
            <br />
            Verify the signal.
            <br />
            Decide with clarity.
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-8 max-w-xl">
            TruthLens blends real-time headlines with AI-assisted credibility cues,
            so your brief stays fast, clean, and grounded in context.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 mb-6 max-w-xl"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search a headline, publisher, topic..."
              className="flex-1 px-5 py-3 rounded-full border border-[var(--line)] bg-[#fffdf8] shadow-[0_10px_24px_rgba(20,14,7,0.08)] text-sm text-[#16120e] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/45 placeholder:text-[#8d7f6f]"
            />
            <button
              type="submit"
              className="shrink-0 px-7 py-3 rounded-full bg-[#12100d] text-[#f7f1e6] text-sm font-semibold transition-colors shadow-[0_12px_24px_rgba(26,18,8,0.2)] hover:bg-[var(--accent)]"
            >
              Search Feed
            </button>
          </form>

          <div className="flex flex-wrap gap-2.5">
            {quickTopics.map((topic) => {
              const isActive = selectedCategory === topic.value;
              return (
                <button
                  key={topic.value}
                  type="button"
                  onClick={() => onCategoryChange(isActive ? "" : topic.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    isActive
                      ? "bg-[#12100d] text-[#f6f1e6] border-[#12100d] shadow-[0_8px_20px_rgba(22,16,8,0.18)]"
                      : "bg-[#fffdf8] text-[var(--muted-foreground)] border-[var(--line)] hover:bg-[#f4eee2]"
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center section-reveal delay-2">
          <div className="w-full max-w-md">
            <div className="overflow-visible bg-transparent">
              <Image
                src={HeroImage}
                alt="Illustration of a modern news verification workflow"
                className="w-full h-auto drop-shadow-[0_24px_50px_rgba(14,18,16,0.35)]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
