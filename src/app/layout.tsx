import { Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";
import Navbar from "@/components/Navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { cn } from "@/lib/utils";
import { siteOrigin } from "@/lib/seo/site";
import SiteIdentitySchema from "@/components/seo/SiteIdentitySchema";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

// Keep RootLayout JSX identical for approved Real Estate protection.
// The legacy body-font binding now uses the site-wide Noto Sans family.
const cinzel = notoSans;

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
  description: "GTH PRO unites Travel, Real Estate, Tender Intelligence and worldwide ticket-source discovery with source-aware research and booking handoffs.",
  keywords: ["GTH PRO", "travel discovery", "property marketplace", "tender intelligence", "worldwide event tickets", "stadium ticket guides"],
  robots: publicLaunch
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "GTH PRO — One Global Ecosystem. Four Pillars.",
    description: "Global Technical Hub for travel, real estate, tender intelligence and worldwide ticket sources.",
    images: [{ url: "/images/global-earth.jpg", alt: "GTH PRO — Global Technical Hub" }],
    type: "website",
    siteName: "GTH PRO",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTH PRO — Global Technical Hub",
    description: "Discover travel, property markets, tender intelligence and event ticket sources.",
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
        <SiteIdentitySchema />
        <script id="gth-impact-stat" type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A8102593-82f8-43dd-baf2-89d6712f2a581.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');` }} />
        <Script id="gth-travelpayouts-drive" strategy="beforeInteractive">
          {`(function () {
            if (window.location.pathname === "/app" || window.location.pathname.startsWith("/app/")) return;
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