import { Cinzel, Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";

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

// Public search visibility is opt-in: preview and unreleased production stay noindex.
const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";

export const metadata: Metadata = {
  metadataBase: new URL("https://gth-pro.vercel.app"),
  title: { default: "GTH PRO | Global Technical Hub", template: "%s | GTH PRO" },
  description: "GTH PRO unites Tours & Travels, Real Estate and Tender Intelligence with source-aware discovery and business onboarding.",
  keywords: ["GTH PRO", "travel discovery", "property marketplace", "tender intelligence"],
  robots: publicLaunch
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "GTH PRO — One Global Ecosystem. Three Pillars.",
    description: "Global Technical Hub for travel, real estate and tender intelligence.",
    type: "website",
    siteName: "GTH PRO",
    url: "/",
  },
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

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
        {gaId && <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>}

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