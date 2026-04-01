"use client";

import { useEffect, useState } from "react";
import NewsGrid from "./components/news/NewsGrid";
import HeroSection from "./components/news/HeroSection";
import Footer from "./components/Footer";
import { normalizePreferences } from "@/lib/shared/settings";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [country, setCountry] = useState("us");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as {
          user?: { preferences?: unknown };
        };

        const prefs = normalizePreferences(data.user?.preferences);
        if (!mounted) {
          return;
        }

        setCountry(prefs.newsCountry);
        setSelectedCategory(prefs.newsCategories[0] ?? "");
      } catch {
        // Ignore preference loading failures for unauthenticated users.
      }
    };

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  const handleResetFeed = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory("");
  };

  const isFeedFiltered =
    searchInput.trim().length > 0 ||
    searchQuery.trim().length > 0 ||
    selectedCategory.length > 0;

  return (
    <div className="page-shell ambient-grid">
      <div className="pointer-events-none absolute -top-10 -left-12 h-52 w-52 rounded-full bg-[rgba(232,176,116,0.26)] blur-3xl" />
      <div className="pointer-events-none absolute top-[7.5rem] -right-14 h-60 w-60 rounded-full bg-[rgba(14,124,102,0.16)] blur-3xl" />

      <main className="page-main">
        <HeroSection
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onResetFeed={handleResetFeed}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isFeedFiltered={isFeedFiltered}
        />

        <section className="space-y-8 section-reveal delay-1">
          <div>
            <div>
              <h2 className="page-title display-title text-3xl sm:text-[2.65rem] font-bold text-[#17130f]">
                Today&apos;s credibility briefings
              </h2>
              <p className="text-sm text-(--muted-foreground) mt-2 max-w-xl">
                Fresh stories with confidence signals from your detection pipeline.
                Scan fast, verify deeper when it matters.
              </p>
            </div>
          </div>

          <div className="border-b border-(--line)" />

          <div>
            <NewsGrid
              country={country}
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
