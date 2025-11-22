"use client";

import { useState } from "react";
import Link from "next/link";

import NewsGrid from "./components/news/NewsGrid";
import HeroSection from "./components/news/HeroSection";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <HeroSection
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Main content sections */}
        <section className="space-y-10">
          <div>
            <NewsGrid
              country="us"
              category={selectedCategory}
              query={searchQuery}
            />
          </div>

          {/* Simple footer like in the reference design */}
          <footer className="border-t border-gray-200 pt-6 mt-4 text-xs text-gray-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="font-semibold text-gray-700">TruthLens</div>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="#" className="hover:text-gray-700">
                  About
                </Link>
                <Link href="#" className="hover:text-gray-700">
                  Contact
                </Link>
                <Link href="#" className="hover:text-gray-700">
                  Privacy
                </Link>
                <Link href="#" className="hover:text-gray-700">
                  Terms
                </Link>
              </div>
              <div className="text-gray-400">
                © {new Date().getFullYear()} TruthLens Media
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
