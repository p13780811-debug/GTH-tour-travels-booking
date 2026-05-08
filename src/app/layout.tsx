import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";


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
  metadataBase: new URL("https://gth-ecosystem.vercel.app"),

  title: "GTH Luxury Travel | International Premium Travel Ecosystem",
  description:
    "GTH Luxury Travel offers premium destinations and luxury hotels worldwide.",

  // ❌ INDEX OFF (construction mode)
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  keywords: ["Luxury Travel", "Premium Hotels"],

  openGraph: {
    title: "GTH Luxury Travel",
    description: "Premium global destinations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${cinzel.className}
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          bg-transparent
        `}
      >
        {/* ✅ SAFE Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"
          strategy="afterInteractive"
        />

        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXX');
          `}
        </Script>

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