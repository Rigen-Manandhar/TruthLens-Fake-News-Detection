import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import ThemeInit from "./components/ThemeInit";
import ToastProvider from "./components/ToastProvider";
import AuthSessionProvider from "./components/Auth/SessionProvider";

// Single Instrument_Sans registration. We assign it to --font-body via the
// font loader and re-alias it to --font-display through inline CSS below so
// .display-title still works without registering the font twice.
const instrumentSans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TruthLens - Misinformation Risk Assessment",
  description: "Assess headlines with source, language, and evidence-support signals without claiming automated truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} antialiased`}
        style={{
          // Alias --font-display to the same font without a second load.
          ["--font-display" as string]: "var(--font-body)",
        }}
      >
        {/* ThemeInit runs synchronously during HTML parsing, before any
            visible content is painted, so the user never sees a flash of
            the wrong theme. Placed inside <body> rather than <head> to
            keep Next.js App Router's auto-injected stylesheet wiring intact. */}
        <ThemeInit />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthSessionProvider>
          <Header />
          {children}
          <ToastProvider />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
