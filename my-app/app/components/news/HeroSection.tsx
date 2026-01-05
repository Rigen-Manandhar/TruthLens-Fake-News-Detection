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
    <section className="mb-12 lg:mb-16">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
        Powered by News API
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
        {/* Left: copy, search, topics */}
        <div>
          <h1 className="text-3xl sm:text-[2.6rem] lg:text-[3rem] font-semibold sm:font-bold text-gray-900 leading-tight tracking-tight mb-4">
            Stay informed with a
            <br />
            clean modern news
            <br />
            experience
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-7 max-w-xl">
            Curated headlines and deep dives across technology, business and
            world affairs, sports and culture, updated in real time.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 mb-6 max-w-xl"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search stories, topics and publishers..."
              className="flex-1 px-5 py-3 rounded-full border border-gray-200/70 bg-white/80 shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="shrink-0 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Topic chips */}
          <div className="flex flex-wrap gap-2">
            {quickTopics.map((topic) => {
              const isActive = selectedCategory === topic.value;
              return (
                <button
                  key={topic.value}
                  type="button"
                  onClick={() => onCategoryChange(isActive ? "" : topic.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5"
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: hero image */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-3xl overflow-hidden bg-transparent">
              <Image
                src={HeroImage}
                alt="Illustration of a modern news experience"
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


