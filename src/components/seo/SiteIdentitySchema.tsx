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
      name: "Live Worldwide Booking Engine and multimodal provider handoffs",
      type: "Worldwide flight, accommodation, cruise, rail, bus and ground-transport search with real-time supplier-operated booking handoffs",
      description: "Live Worldwide Booking Engine providing supplier-operated, real-time search and booking handoffs for worldwide flights, hotels, cruises, trains, buses, ferries and ground transport, plus tours and activities. Connected supplier networks include millions of accommodation listings: Nuitee publicly reports a network of 2.9 million properties worldwide. This is partner-wide supply, not a count of GTH PRO-owned or individually confirmed listings; booking coverage, prices and fulfilment depend on each provider.",
      path: "/travel",
    },
    {
      name: "Global Real Estate Research, Buyer Intelligence and B2B Leads",
      type: "Global property registry references, market intelligence, buyer financial planning, ownership workflows and property enquiries",
      description: "Discover 12,500+ recorded property references (separate from verified sale inventory), source-backed registry research, locality and market intelligence, price-evidence review, saved comparisons, mortgage and affordability scenarios, rental-return planning, property leads, broker submissions and private owner/CRM workspaces. Official approval, title and live inventory are separately reviewed; the total record count is not 12,500 independently verified properties.",
      path: "/real-estate",
    },
    {
      name: "Public Tender Intelligence, Eligibility and Bid Preparation",
      type: "Source-attributed multi-country procurement research, eligibility checks, deadline management and bid-readiness workspace",
      description: "Research 4,000+ published public tender records with source references, country and sector discovery, deadlines, eligibility self-assessment, document planning, pre-bid/site-visit checklists, bid-preparation guidance and private service enquiries. Changes, eligibility, evidence and final applications must be checked against the issuing procurement authority.",
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
    { name: "Worldwide activities", path: "/activities" },
    { name: "Source-attributed attractions", path: "/attractions" },
    { name: "Partner-managed travel deals", path: "/travel/deals" },
    { name: "Cruises and sightseeing sailings", path: "/cruises" },
    { name: "Rail travel search", path: "/train" },
    { name: "Bus travel search", path: "/bus" },
    { name: "Airport and ground transfers", path: "/transfers" },
    { name: "Worldwide destinations", path: "/destinations" },
    { name: "Real estate discovery", path: "/real-estate" },
    { name: "Public project registry", path: "/real-estate/registry" },
    { name: "Property buyer planning tools", path: "/real-estate/tools" },
    { name: "Source-backed property market intelligence", path: "/real-estate/market-intelligence" },
    { name: "Property submissions for review", path: "/real-estate/post-property" },
    { name: "Public tender discovery", path: "/tender" },
    { name: "Tender preparation services", path: "/tender/services" },
    { name: "Tender eligibility and application assistant", path: "/tender/assistant" },
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
        description: "GTH PRO Global is an operating multi-sector digital platform, an initiative of Etios Profession. It combines travel technology through a Live Worldwide Booking Engine with real-time provider search and supplier-operated booking handoffs across global flights, hotels, cruises, trains, buses and ground transport; Real Estate registry research, buyer intelligence and B2B leads; multi-country public tender intelligence and bid preparation; and worldwide ticket and stadium discovery. Connected accommodation suppliers report millions of property listings, independently operated outside GTH PRO. No booking, property title, tender award or event inventory is guaranteed by GTH PRO.",
        logo: siteUrl("/images/gth-logo.png"),
        email: SITE_CONFIG.contactEmail,
        knowsAbout: [
          "Live worldwide provider-operated flights, hotel search and accommodation booking handoffs, including Nuitee\u2019s publicly reported 2.9 million-property global supplier network",
          "Cruise, tours, activities, train, bus, ferry and airport transfer provider search, with suppliers controlling rates and availability",
          "Property registry discovery, developer/broker onboarding, comparative market evidence, affordability and mortgage calculations, buyer CRM and direct B2B enquiries",
          "Source-backed public tenders, deadline awareness, eligibility self-assessment, bid preparation, document and pre-bid planning",
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
            name: "How GTH PRO Works",
            url: siteUrl("/system"),
          },
          {
            "@type": "WebPage",
            name: "Worldwide ticket and venue-source discovery",
            url: siteUrl("/tickets"),
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
        description: "GTH PRO Global connects a worldwide provider-handoff booking search engine for flights, hotels, cruises, trains, buses and ground transport with Real Estate market intelligence, property enquiry workflows, public procurement intelligence and independent worldwide ticket-source research. Supplier networks, not GTH PRO local database rows, determine live travel reach.",
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
