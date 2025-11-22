"use client";

export default function FakeDetectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
            Experimental
          </p>
          <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-gray-900 leading-tight tracking-tight">
            Fake News Detection (coming soon)
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            This area will let you paste headlines, URLs or upload content and
            get AI-assisted signals about credibility, source reputation and
            potential manipulation. For now, explore live news on the home page
            while we build this experience.
          </p>
        </header>
      </main>
    </div>
  );
}


