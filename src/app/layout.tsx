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

const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
const baseUrl = "https://gth-pro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GTH PRO | Global Technical Hub",
    template: "%s | GTH PRO",
  },
  description: "Explore the three pillars of GTH PRO: Tours & Travels, Real Estate, and Tender Intelligence. Find services, verified-source opportunities and business connections.",
  applicationName: "GTH PRO",
  keywords: ["global travel", "real estate discovery", "tender intelligence", "GTH PRO"],
  alternates: { canonical: "/" },
  robots: publicLaunch
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "GTH PRO — One Ecosystem, Three Pillars",
    description: "Tours & Travels, Real Estate, and Tender Intelligence in one connected global hub.",
    siteName: "GTH PRO",
    type: "website",
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