import Image from "next/image";

import HeroImage from "../../Images/HeroImage.gif";

interface HeroSectionProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onResetFeed: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isFeedFiltered: boolean;
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
  onResetFeed,
  selectedCategory,
  onCategoryChange,
  isFeedFiltered,
}: HeroSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <section className="mb-12 lg:mb-16 relative section-reveal">
      <div className="pointer-events-none absolute -top-8 left-0 h-44 w-44 rounded-full bg-[rgba(232,176,116,0.36)] blur-3xl" />
      <div className="pointer-events-none absolute top-4 right-16 h-36 w-36 rounded-full bg-[rgba(14,124,102,0.28)] blur-3xl" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.26fr)_minmax(0,1fr)] items-center py-2 sm:py-6 lg:py-8">
        <div className="section-reveal delay-1 min-w-0">
          <h1 className="page-title display-title text-4xl sm:text-[3.35rem] lg:text-[3.8rem] font-bold text-[#17130f] mb-5">
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
              className="shrink-0 w-full sm:w-auto px-7 py-3 rounded-full bg-[#12100d] text-[#f7f1e6] text-sm font-semibold transition-colors shadow-[0_12px_24px_rgba(26,18,8,0.2)] hover:bg-[var(--accent)]"
            >
              Search Feed
            </button>
            {isFeedFiltered && (
              <button
                type="button"
                onClick={onResetFeed}
                className="shrink-0 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[#fffdf8] px-5 py-3 text-sm font-semibold text-[#5f5548] shadow-[0_10px_24px_rgba(20,14,7,0.08)] transition-colors hover:bg-[#f4eee2] sm:w-auto"
                aria-label="Reset news feed"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M16.667 10A6.667 6.667 0 1 1 14.714 5.286"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.667 3.333v4.167H12.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Reset Feed
              </button>
            )}
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
