import type { Metadata } from "next";
import FlagshipHome from "@/components/home/FlagshipHome";
import JsonLd from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "GTH PRO | Global Travel, Real Estate & Tender Platform",
  description: "Discover travel planning, global property markets and public tender opportunities with GTH PRO, the Global Technical Hub.",
  alternates: { canonical: "/" },
};

const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": siteUrl("/") + "#organization",
      name: "GTH PRO",
      url: siteUrl("/"),
      logo: siteUrl("/gth-app-brand.svg"),
      description: "Global Technical Hub for travel, real estate and tender intelligence.",
    },
    {
      "@type": "WebSite",
      "@id": siteUrl("/") + "#website",
      name: "GTH PRO",
      url: siteUrl("/"),
      publisher: { "@id": siteUrl("/") + "#organization" },
      inLanguage: "en",
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={homepageStructuredData} />
      <FlagshipHome />
    </>
  );
}
