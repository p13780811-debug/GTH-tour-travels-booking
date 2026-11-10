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
        description: "GTH PRO, a digital initiative of Etios Profession, connects real estate research and market intelligence, travel technology and supplier referrals, and official-source public tender discovery. GTH PRO is an independent platform, not a government agency or booking supplier.",
        logo: siteUrl("/images/gth-logo.png"),
        email: SITE_CONFIG.contactEmail,
        knowsAbout: [
          "Real estate discovery and property market intelligence",
          "Travel technology, hotel white-label discovery, tours and affiliate referrals",
          "Public procurement notices and tender research"
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
        description: "Real estate analysis, global travel discovery and public tender intelligence, with explicit supplier handoffs and source-attributed content.",
        publisher: { "@id": organizationId },
        inLanguage: "en",
        about: [
          { "@type": "Thing", name: "Real estate analytics", url: siteUrl("/real-estate") },
          { "@type": "Thing", name: "Travel discovery and affiliate technology", url: siteUrl("/travel") },
          { "@type": "Thing", name: "Public tender intelligence", url: siteUrl("/tender") }
        ],
        hasPart: [
          { "@type": "WebPage", name: "About GTH PRO", url: siteUrl("/about") },
          { "@type": "WebPage", name: "Verification and Transparency", url: siteUrl("/verification") },
          { "@type": "WebPage", name: "Affiliate Disclosure", url: siteUrl("/affiliate-disclosure") }
        ]
      }
    ]
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: safeStructuredData(graph),
  }} />;
}
