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
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <HeroSection
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <section className="space-y-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.25em] text-gray-400 uppercase">
                Top headlines
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-2">
                Today&apos;s briefings
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">
                Fresh stories curated from trusted sources, updated throughout the day.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              Live updates every hour
            </div>
          </div>

          <div className="border-b border-gray-200/70" />

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
