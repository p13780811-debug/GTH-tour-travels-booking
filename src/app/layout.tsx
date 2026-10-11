import { Cinzel, Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gth-pro.vercel.app"),

  title: {
    default: "GTH PRO | Global Real Estate, Travel & Tenders Ecosystem",
    template: "%s | GTH PRO",
  },
  description:
    "Explore GTH PRO, a global ecosystem for real estate discovery, travel experiences and tender opportunities.",

  // Preserve noindex until production inventory, access policies and release gates are verified.
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  keywords: ["GTH PRO", "Global Real Estate", "Travel", "Tender Opportunities"],

  openGraph: {
    title: "GTH PRO | Global Ecosystem",
    description: "Real estate, travel and tender opportunities in one global ecosystem.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", notoSans.variable, playfairDisplayHeading.variable)}>
      <body
        className={`
          ${cinzel.className}
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          bg-transparent
        `}
      >
        {/* ✅ GLOBAL NAVBAR (same for all pages) */}
        <Navbar />

        {/* ✅ ALL CONDITIONAL UI handled here */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>


      </body>
    </html>
  );
}