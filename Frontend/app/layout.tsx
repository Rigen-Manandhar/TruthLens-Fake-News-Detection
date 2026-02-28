import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import ToastProvider from "./components/ToastProvider";
import AuthSessionProvider from "./components/Auth/SessionProvider";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const displayFont = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TruthLens - AI News Credibility",
  description: "Verify headlines faster with AI-assisted fake news detection and live signal scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <AuthSessionProvider>
          <Header />
          {children}
          <ToastProvider />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
