import { safeStructuredData, siteUrl } from "@/lib/seo/site";

/**
 * Factual, non-promotional identity: no invented corporate registration,
 * physical address, celebrity founder, reviews, ratings or booking capability.
 */
export default function SiteIdentitySchema() {
  const origin = siteUrl("/");
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": origin + "#organization",
        name: "GTH PRO",
        alternateName: "Global Technical Hub",
        url: origin,
        description: "Independent digital discovery platform for travel, real estate and tender information.",
        email: "official.gthpro@gmail.com",
        logo: siteUrl("/images/gth-logo.png"),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "business enquiries",
          email: "official.gthpro@gmail.com",
          url: siteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": origin + "#website",
        name: "GTH PRO",
        alternateName: "Global Technical Hub",
        url: origin,
        description: "Travel, property and tender discovery in one platform.",
        publisher: { "@id": origin + "#organization" },
        inLanguage: "en",
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: safeStructuredData(graph),
  }} />;
}
