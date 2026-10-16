import { Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { cn } from "@/lib/utils";
import { siteOrigin } from "@/lib/seo/site";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Explicit physical-device viewport; prevents narrow Android screens falling
// back to a virtual desktop canvas with three unreadable tiny pillar cards.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Public search visibility is opt-in: preview and unreleased production stay noindex.
const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: "GTH PRO",
  icons: { apple: [{ url: "/app-icon/180", sizes: "180x180", type: "image/png" }] },
  title: { default: "GTH PRO | Global Technical Hub", template: "%s" },
  description: "GTH PRO unites Tours & Travels, Real Estate and Tender Intelligence with source-aware discovery and business onboarding.",
  keywords: ["GTH PRO", "travel discovery", "property marketplace", "tender intelligence"],
  robots: publicLaunch
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "GTH PRO — One Global Ecosystem. Three Pillars.",
    description: "Global Technical Hub for travel, real estate and tender intelligence.",
    images: [{ url: "/images/global-earth.jpg", alt: "GTH PRO — Global Technical Hub" }],
    type: "website",
    siteName: "GTH PRO",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTH PRO — Global Technical Hub",
    description: "Discover travel, property markets and tender intelligence.",
    images: ["/images/global-earth.jpg"],
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
      {/* Travelpayouts Drive: project-specific, asynchronous AI affiliate tool. */}
      <head>
        <Script id="gth-travelpayouts-drive" strategy="beforeInteractive">
          {`(function () {
            if (document.querySelector('script[src^="https://emrldtp.com/NTA0MzQy.js"]')) return;
            var script = document.createElement("script");
            script.async = true;
            script.setAttribute("data-cmp-ab", "2");
            script.src = "https://emrldtp.com/NTA0MzQy.js?t=504342";
            document.head.appendChild(script);
          })();`}
        </Script>
      </head>
      <body
        className={`
          ${notoSans.className}
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