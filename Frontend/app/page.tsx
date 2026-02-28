"use client";

import { useState } from "react";
import NewsGrid from "./components/news/NewsGrid";
import HeroSection from "./components/news/HeroSection";
import Footer from "./components/Footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="relative min-h-screen pt-24 ambient-grid overflow-hidden">
      <div className="pointer-events-none absolute -top-10 -left-12 h-52 w-52 rounded-full bg-[rgba(232,176,116,0.26)] blur-3xl" />
      <div className="pointer-events-none absolute top-[7.5rem] -right-14 h-60 w-60 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <HeroSection
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <section className="space-y-8 section-reveal delay-1">
          <div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.25em] text-[var(--muted-foreground)] uppercase">
                Curated stream
              </p>
              <h2 className="display-title text-3xl sm:text-[2.65rem] font-bold text-[#17130f] mt-2">
                Today&apos;s credibility briefings
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-xl">
                Fresh stories with confidence signals from your detection pipeline.
                Scan fast, verify deeper when it matters.
              </p>
            </div>
          </div>

          <div className="border-b border-[var(--line)]" />

          <div>
            <NewsGrid
              country="us"
              category={selectedCategory}
              query={searchQuery}
            />
          </div>

          <Footer />
        </section>
      </main>
    </div>
  );
}
