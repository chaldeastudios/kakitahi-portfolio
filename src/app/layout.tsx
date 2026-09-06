import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

/**
 * Fonts transcribed from the project's TextStyles:
 *   Geist 500 / 600 — every style except Heading 5
 *   Inter Medium    — Heading 5
 */
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paige Holden — Product Designer",
  description:
    "I'm a product designer who works with early-stage companies and scaling teams. I turn complicated, half-finished experiences into products that feel obvious to use.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
