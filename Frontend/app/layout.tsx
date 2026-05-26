import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import ToastProvider from "./components/ToastProvider";
import AuthSessionProvider from "./components/Auth/SessionProvider";

const bodyFont = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Instrument_Sans({
  variable: "--font-display",
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
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
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
