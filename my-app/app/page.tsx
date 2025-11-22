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

        {/* Main content sections */}
        <section className="space-y-10">
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
