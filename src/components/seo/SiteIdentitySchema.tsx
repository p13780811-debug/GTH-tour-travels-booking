import { SITE_CONFIG } from "@/lib/site-config";
import { safeStructuredData, siteUrl } from "@/lib/seo/site";

/**
 * Official public identity, not a claim of government status, registrations,
 * partner exclusivity, accredited supplier inventory or booking guarantees.
 * Google recommends a consistent Organization + WebSite graph for site identity.
 * Only first-party GTH PRO controlled URLs are linked as owned pages.
 */
export default function SiteIdentitySchema() {
  const origin = siteUrl("/");
  const organizationId = origin + "#organization";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "GTH PRO",
        alternateName: ["Global Technical Hub", "GTH PRO Global"],
        url: origin,
        description: "GTH PRO, a digital initiative of Etios Profession, combines independent property and buyer research tools, travel discovery with supplier-operated handoffs, public-source tender intelligence and bid readiness, and worldwide event and stadium ticket-source research. It is not a government agency or a supplier booking operator.",
        logo: siteUrl("/images/gth-logo.png"),
        email: SITE_CONFIG.contactEmail,
        knowsAbout: [
          "Real estate discovery and property market intelligence",
          "Travel technology, hotel white-label discovery, tours and affiliate referrals",
          "Public procurement notices and tender research",
          "Worldwide sports, concert, theatre and stadium ticket-source discovery"
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "business enquiries",
          email: SITE_CONFIG.contactEmail,
          url: siteUrl("/contact")
        },
        subjectOf: {
          "@type": "WebPage",
          name: "GTH PRO Verification and Transparency",
          url: siteUrl("/verification")
        }
      },
      {
        "@type": "WebSite",
        "@id": origin + "#website",
        name: "GTH PRO",
        alternateName: "Global Technical Hub",
        url: origin,
        description: "Real estate, global travel, tender intelligence and worldwide ticket-source research with explicit third-party booking and source attribution.",
        publisher: { "@id": organizationId },
        inLanguage: "en",
        about: [
          { "@type": "Thing", name: "Real estate analytics", url: siteUrl("/real-estate") },
          { "@type": "Thing", name: "Travel discovery and affiliate technology", url: siteUrl("/travel") },
          { "@type": "Thing", name: "Public tender intelligence", url: siteUrl("/tender") },
          { "@type": "Thing", name: "Worldwide event and stadium ticket-source discovery", url: siteUrl("/tickets") }
        ],
        hasPart: [
          { "@type": "WebPage", name: "About GTH PRO", url: siteUrl("/about") },
          { "@type": "WebPage", name: "Verification and Transparency", url: siteUrl("/verification") },
          { "@type": "WebPage", name: "How GTH PRO Works", url: siteUrl("/system") },
          { "@type": "WebPage", name: "Affiliate Disclosure", url: siteUrl("/affiliate-disclosure") }
        ]
      }
    ]
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: safeStructuredData(graph),
  }} />;
}
