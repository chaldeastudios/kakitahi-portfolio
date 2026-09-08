import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart/CartProvider";

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
  title: "Isaiah Kakitahi — Design, Technology & Strategy",
  description:
    "Designer and builder working with founders, small businesses and nonprofits. Websites, brand systems and AI-enabled tooling.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
