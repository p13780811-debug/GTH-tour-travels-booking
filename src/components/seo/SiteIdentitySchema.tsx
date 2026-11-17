import { SITE_CONFIG } from "@/lib/site-config";
import { safeStructuredData, siteUrl } from "@/lib/seo/site";

/**
 * One Organization + WebSite graph in the existing root layout.
 * Every URL is first-party and every described service has a public route on
 * the deployed main branch. Discovery/referral is NOT supplier fulfilment.
 * Do not add credentials, analytics, speculative certifications or unmerged PRs.
 */
export default function SiteIdentitySchema() {
  const origin = siteUrl("/");
  const organizationId = origin + "#organization";
  const services = [
    {
      name: "Global travel research and booking handoffs",
      type: "Travel search, supplier booking referrals and travel planning",
      description: "Search and research flights, hotels, tours, activities, cruises, buses, trains, transfers and destinations. Final availability, pricing, tickets, payment and fulfilment belong to independent suppliers.",
      path: "/travel",
    },
    {
      name: "Real estate registry discovery and buyer research",
      type: "Real estate research, listing intake, property enquiries and buyer planning",
      description: "Browse source-attributed registered projects, distinguish research records from reviewed listings, use property planning tools, and submit property or business enquiries for review. No title or ownership certification is implied.",
      path: "/real-estate",
    },
    {
      name: "Public tender intelligence and bid readiness",
      type: "Public procurement research and tender preparation guidance",
      description: "Search publicly released procurement notices, compare source references and use bid-readiness and service-request tools. Government authorities determine eligibility, tender documents and official submission.",
      path: "/tender",
    },
    {
      name: "Worldwide tickets and stadium source guides",
      type: "Event ticket-source research and venue planning",
      description: "Research sports, concerts, theatre, attractions and stadium guides with independent ticket-source links. Ticket supply, admission and checkout are not guaranteed by GTH PRO.",
      path: "/tickets",
    },
  ] as const;
  const publicPages = [
    { name: "Travel platform", path: "/travel" },
    { name: "Flight search", path: "/flights" },
    { name: "Hotel discovery and supplier booking entry", path: "/hotels" },
    { name: "Tours and activities", path: "/tours" },
    { name: "Cruises and sightseeing sailings", path: "/cruises" },
    { name: "Rail travel search", path: "/train" },
    { name: "Bus travel search", path: "/bus" },
    { name: "Airport and ground transfers", path: "/transfers" },
    { name: "Worldwide destinations", path: "/destinations" },
    { name: "Real estate discovery", path: "/real-estate" },
    { name: "Public project registry", path: "/real-estate/registry" },
    { name: "Property buyer planning tools", path: "/real-estate/tools" },
    { name: "Property submissions for review", path: "/real-estate/post-property" },
    { name: "Public tender discovery", path: "/tender" },
    { name: "Tender preparation services", path: "/tender/services" },
    { name: "Worldwide ticket-source finder", path: "/tickets" },
    { name: "Stadium and venue guides", path: "/stadiums" },
    { name: "About GTH PRO", path: "/about" },
    { name: "Verification and Transparency", path: "/verification" },
    { name: "How GTH PRO Works", path: "/system" },
    { name: "GTH PRO Ecosystem Manifest", path: "/gth-ecosystem-manifest" },
    { name: "Contact and B2B enquiries", path: "/contact" },
    { name: "Affiliate Disclosure", path: "/affiliate-disclosure" },
  ] as const;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "GTH PRO",
        alternateName: ["Global Technical Hub", "GTH PRO Global"],
        url: origin,
        description: "GTH PRO Global is an operating multi-sector digital platform, an initiative of Etios Profession, connecting real estate research and B2B enquiries, travel technology with supplier-operated booking handoffs, source-aware public tender intelligence, and worldwide event ticket-source discovery. It does not operate airlines, issue public tenders, or independently guarantee ticket inventory or booking fulfilment.",
        logo: siteUrl("/images/gth-logo.png"),
        email: SITE_CONFIG.contactEmail,
        knowsAbout: [
          "Global travel technology, flight and hotel supplier booking handoffs",
          "Cruises, tours, bus and train travel, activities and airport transfers",
          "Real estate registry research, listing review, direct property enquiries and buyer planning",
          "Public-source tender intelligence, procurement discovery and bid readiness",
          "Worldwide sports, concert, theatre and stadium ticket-source research",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "GTH PRO public digital discovery and research services",
          itemListElement: services.map(service => ({
            "@type": "Service",
            name: service.name,
            serviceType: service.type,
            description: service.description,
            url: siteUrl(service.path),
            provider: { "@id": organizationId },
          })),
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "business enquiries",
          email: SITE_CONFIG.contactEmail,
          url: siteUrl("/contact"),
        },
        subjectOf: [
          {
            "@type": "WebPage",
            name: "GTH PRO Verification and Transparency",
            url: siteUrl("/verification"),
          },
          {
            "@type": "WebPage",
            name: "GTH PRO Ecosystem Manifest",
            url: siteUrl("/gth-ecosystem-manifest"),
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": origin + "#website",
        name: "GTH PRO",
        alternateName: "Global Technical Hub",
        url: origin,
        description: "Operating global digital ecosystem for travel research and supplier booking handoffs, real estate discovery, public tender intelligence and independent worldwide ticket-source guides.",
        publisher: { "@id": organizationId },
        inLanguage: "en",
        about: services.map(service => ({
          "@type": "Service",
          name: service.name,
          description: service.description,
          url: siteUrl(service.path),
        })),
        hasPart: publicPages.map(page => ({
          "@type": "WebPage",
          name: page.name,
          url: siteUrl(page.path),
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: safeStructuredData(graph),
  }} />;
}
