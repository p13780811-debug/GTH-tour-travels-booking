import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "GTH PRO Global Ecosystem Manifest | Four Connected Digital Platforms",
  description: "GTH Global Booking Engine with millions of supplier-network accommodation listings, flights, hotels, cruises, trains and buses; Real Estate buyer intelligence, B2B leads, tender eligibility and worldwide tickets.",
  alternates: { canonical: siteUrl("/gth-ecosystem-manifest") },
  robots: { index: isPublicLaunch(), follow: true },
  openGraph: {
    title: "GTH PRO Global | GTH Global Booking Engine & Four-Pillar Intelligence",
    description: "Worldwide supplier booking handoffs and millions-scale partner accommodation coverage, plus real estate intelligence, public tender tools and global ticket discovery.",
    url: siteUrl("/gth-ecosystem-manifest"),
    siteName: "GTH PRO Global",
    type: "article",
  },
};

const pillars = [
  {
    name: "Worldwide Travel",
    href: "/travel",
    description: "The GTH Global Booking Engine connects real-time provider-operated search and handoffs for worldwide flights, hotels, cruises, trains, buses, ferries and ground transport, plus tours, activities, airport transfers, car rentals and destination planning. GTH Worldwide Stays connects global search to independently operated accommodation networks spanning millions of supplier-reported listings. GTH PRO operates the branded booking-search gateway, while GTH Provider-Operated Handoffs leave final dates, availability, rates, payments and fulfilment with the supplier. The global travel network is not limited by GTH PRO's local research catalog.",
  },
  {
    name: "Global Real Estate",
    href: "/real-estate",
    description: "The Global Real Estate platform maintains 12,500+ recorded property references and connects source-backed registry discovery, regional market and locality evidence, property comparisons, shortlist and research workspaces, mortgage EMI, affordability and rental-return scenarios, price-evidence tracking, property enquiries, project-claim review, broker onboarding, listings and private customer relationship management. Buyer, owner and administrator access are separate. The count refers to records; official regulator approval, GTH verification, lawful title and available units are different checks and are never implied for every record.",
  },
  {
    name: "Public Tender Intelligence",
    href: "/tender",
    description: "The multi-country procurement gateway currently stores 4,000+ published public tender records. It supports jurisdiction and sector discovery, source references, deadline research, tender comparisons, eligibility self-assessment, document checklists, pre-bid attendance and site-visit preparation, application-readiness stages and private assistance enquiries. The first-party Tender Intelligence Workspace distinguishes reviewed source requirements from suggested planning tasks. Government issuers control official notices, corrigenda, applications, decisions and awards; an automated readiness score cannot certify eligibility.",
  },
  {
    name: "Worldwide Tickets and Venues",
    href: "/tickets",
    description: "The ticket research platform organizes discovery of sports, concerts, theatre, attractions and other events. Stadium and destination guides help visitors identify relevant venues and independent ticket sources. Links to an operator or seller are references for further verification, not promises of specific event availability, official authorization, admission or final ticket pricing.",
  },
] as const;

export default function EcosystemManifestPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO Global · Public Ecosystem Manifest</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">GTH Global Booking Engine. Four connected intelligence platforms.</h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--text-soft)]">
            GTH PRO (Global Technical Hub) is a multi-sector digital platform and an initiative of Etios Profession.
            It is not a local software demo. Its GTH Global Booking Engine connects users to supplier-hosted
            real-time travel searches and provider-operated checkout for worldwide flights, hotels, cruises, trains,
            buses and ground transport, including accommodation networks with millions of supplier listings.
            Alongside travel, GTH PRO operates first-party Real Estate research, direct business enquiries,
            tender eligibility and procurement intelligence, plus worldwide ticket-source discovery.
            This manifest distinguishes proven public capabilities from pending releases and external suppliers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/verification" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-5 font-semibold">Verification & transparency</Link>
            <Link href="/system" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-5 font-semibold">How the platform works</Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="manifest-platforms" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="manifest-platforms" className="text-2xl font-semibold">The four public platforms</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {pillars.map(pillar => (
            <article key={pillar.href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h3 className="text-xl font-semibold">{pillar.name}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{pillar.description}</p>
              <Link href={pillar.href} className="mt-4 inline-flex min-h-10 items-center font-semibold text-[var(--gold)] underline underline-offset-2">Explore {pillar.name}</Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="manifest-scale" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="manifest-scale" className="text-2xl font-semibold">GTH Global Booking Engine · GTH Worldwide Stays</h2>
        <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
          GTH PRO Global operates a GTH Global Booking Engine for real-time, provider-operated
          search and handoff across millions-scale partner inventories, with worldwide flights,
          hotels, cruises, trains, buses, ferries and ground transport in its travel discovery
          ecosystem. GTH Worldwide Stays connects travelers to accommodation searches, GTH Flight Search
          supports international air-travel discovery, and GTH Mobility connects multimodal
          transport routes. GTH Event Concierge and GTH Experiences provide separate
          ticket, cruise, tour and attraction discovery paths. GTH Provider-Operated Handoffs
          direct users to independently operated supplier booking environments.
          The network supplies availability, final rates, checkout and fulfilment. GTH PRO does not
          claim to store, own or individually verify millions of properties.
        </p>
        <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
          The <strong>GTH Global Booking Engine</strong> presents search journeys into
          independently operated accommodation networks with <strong>millions of
          supplier-reported listings</strong>. These describe the breadth of connected
          supplier networks, not GTH PRO-owned inventory or a guarantee that each listing
          is available in any given search. GTH Verified Network Partners refers to reviewed
          handoff integrations, not certification of every room, event or price. Final booking
          availability and checkout terms remain with each supplier. See the
          <Link href="/affiliate-disclosure" className="ml-1 font-semibold text-[var(--gold)] underline">provider and affiliate disclosure</Link>
          for the underlying operating model.
        </p>
      </section>
      <section aria-labelledby="manifest-intelligence" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="manifest-intelligence" className="text-2xl font-semibold">First-party intelligence and business workflow capabilities</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-lg font-semibold">Real Estate research, ROI and direct leads</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Beyond registry directories, buyers can use monthly EMI and affordability scenarios,
              ownership-cost stress tests, rental income calculations, locality market evidence,
              shortlist comparisons and private enquiry workflows. Brokers and owners have listing
              submission, project-claim review and account workspace options, while administrator
              access to buyer CRM and lead follow-ups is controlled separately. These tools provide
              decision support; they do not promise a property's valuation or verify legal title.
            </p>
            <nav aria-label="Property intelligence links" className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href="/real-estate/tools" className="font-semibold text-[var(--gold)] underline">Buyer planning</Link>
              <Link href="/real-estate/market-intelligence" className="font-semibold text-[var(--gold)] underline">Market evidence</Link>
              <Link href="/real-estate/registry" className="font-semibold text-[var(--gold)] underline">Registry research</Link>
            </nav>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-lg font-semibold">Tender discovery, eligibility and preparation</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Procurement research includes source-linked tender searches, deadline awareness,
              qualifications self-assessment, tender requirements review, device-local document
              preparation, pre-bid and site-attendance checklists, and structured application
              readiness guidance. Businesses can request separately reviewed support quotes.
              Document staging does not upload secret files to an external supplier by default,
              and readiness results never substitute for the issuing authority's decisions.
            </p>
            <nav aria-label="Tender intelligence links" className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href="/tender/assistant" className="font-semibold text-[var(--gold)] underline">Eligibility assistant</Link>
              <Link href="/tender/services" className="font-semibold text-[var(--gold)] underline">Bid support services</Link>
              <Link href="/tender" className="font-semibold text-[var(--gold)] underline">Tender intelligence</Link>
            </nav>
          </article>
        </div>
      </section>
      <section aria-labelledby="manifest-architecture" className="border-y border-[var(--border)] bg-[var(--card)]/60">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <h2 id="manifest-architecture" className="text-2xl font-semibold">Architecture, data and operating boundaries</h2>
          <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
            The public web application uses Next.js routing and server-side rendering, with Vercel deployment
            and Supabase-backed relational data for supported discovery and submission workflows.
            Dedicated API routes separate searchable public information from private write actions;
            input validation, rate limits and database row-level security protect supported access paths.
            First-party pages, supplier-hosted white labels, tracked affiliate referrals and external
            government documents are deliberately different services. The system provides research,
            navigation and handoffs rather than pretending every external supplier is a GTH PRO-owned
            fulfilment operation.
          </p>
          <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
            Cross-platform navigation is another published capability: destination research can direct
            visitors to relevant hotel, flight, attraction, property and tender gateways without
            converting a public record into a booked service. These links make it easier to move
            between travel planning, local market research and procurement discovery in one
            domain. The public architecture also includes mobile-oriented navigation, searchable
            directories and transparency pages. Where a provider does not support a
            destination-specific result, the website must distinguish a broad search from an
            exact-match handoff. This is a connected digital research system, not a claim
            that all sectors share one verified transaction inventory.
          </p>
          <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
            A read-only database audit on 17 November 2026 found over 12,500 recorded property
            references and over 4,000 published public tender records; the same platform also
            maintains community-mapped attraction references. These are first-party research and
            workflow datasets, not counts of independently verified sale units, confirmed procurement
            opportunities or completed orders. The GTH Global Booking Engine is fundamentally
            different: it sends itinerary searches to external providers and partner white labels.
            Its reach is governed by live supplier coverage, not by rows in the GTH PRO database.
            The provider-hosted reservation or ticket system is the final authority for availability,
            taxes, booking terms and payment.
          </p>
        </div>
      </section>

      <section aria-labelledby="manifest-business" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="manifest-business" className="text-2xl font-semibold">Business access, transparency and release status</h2>
        <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
          Business owners, property professionals, travel suppliers and other organizations can
          use the public <Link href="/contact" className="font-semibold text-[var(--gold)] underline">contact and partnership enquiry</Link> channels.
          Leads and proposals are submitted for review, not automatically accepted or displayed.
          Editorial pages distinguish community-mapped locations, official source references,
          partner-operated checkout and user-submitted project information. This manifest is
          an explanation of the current public website, not a claim of government affiliation,
          enterprise certification or guaranteed indexing by AI search engines.
        </p>
        <p className="mt-4 max-w-5xl text-sm leading-8 text-[var(--text-soft)]">
          Feature branches that have passed development tests do not become live website features
          until they are merged, successfully deployed and checked on the public domain.
          Current policies, supported service routes, affiliate disclosure and source limitations
          remain available for independent evaluation. For business enquiries, contact
          <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="ml-1 font-semibold text-[var(--gold)] underline">{SITE_CONFIG.contactEmail}</a>.
        </p>
        <nav aria-label="Public verification and business policies" className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/about" className="text-[var(--gold)] underline">About GTH PRO</Link>
          <Link href="/affiliate-disclosure" className="text-[var(--gold)] underline">Affiliate disclosure</Link>
          <Link href="/privacy-policy" className="text-[var(--gold)] underline">Privacy policy</Link>
          <Link href="/terms-and-conditions" className="text-[var(--gold)] underline">Terms and conditions</Link>
        </nav>
      </section>
    </main>
  );
}
