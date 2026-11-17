import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "GTH PRO Global Ecosystem Manifest | Four Connected Digital Platforms",
  description: "Read the audited public operating model of GTH PRO Global: travel booking handoffs, real estate discovery, procurement intelligence, worldwide tickets, technical architecture and data provenance.",
  alternates: { canonical: siteUrl("/gth-ecosystem-manifest") },
  robots: { index: isPublicLaunch(), follow: true },
  openGraph: {
    title: "GTH PRO Global | Digital Ecosystem and Architecture Manifest",
    description: "An evidence-based guide to four operating GTH PRO platforms, supplier boundaries, source data and public technology.",
    url: siteUrl("/gth-ecosystem-manifest"),
    siteName: "GTH PRO Global",
    type: "article",
  },
};

const pillars = [
  {
    name: "Worldwide Travel",
    href: "/travel",
    description: "GTH PRO provides flight search, hotel discovery, tours and activities, cruise and sightseeing research, bus and train search, transfers, car rental guidance and destination pages. Visitors use the GTH PRO interface to compare routes or browse places, then continue to the relevant supplier or affiliate booking environment. A hotel directory record does not confirm a room, and flight search observations are not issued tickets. Providers control live inventory, payment, cancellation policies and fulfilment.",
  },
  {
    name: "Global Real Estate",
    href: "/real-estate",
    description: "The property gateway connects market research, recorded project registry references, buyer planning tools, comparison, saving and enquiry workflows. Owners, agents and developers can submit information for review. Public registration records, reviewed marketplace listings and additional GTH verification are different statuses. Neither a project reference nor an enquiry constitutes a verified title, current available unit, licensed brokerage instruction or guaranteed transaction.",
  },
  {
    name: "Public Tender Intelligence",
    href: "/tender",
    description: "The procurement gateway displays source-attributed tender records, jurisdiction and sector filters, document references and bid-readiness guidance. Public notices have deadlines and issuing authorities that require fresh source checks. GTH PRO is an independent research and preparation interface, not a government publishing authority, electronic procurement submission system or procurement award guarantor.",
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
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">One operating digital ecosystem. Four connected discovery platforms.</h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--text-soft)]">
            GTH PRO (Global Technical Hub) is a multi-sector digital platform and an initiative of Etios Profession.
            It is not a generic software demo or local-only project. Its published website connects first-party
            research and business enquiries to independent travel suppliers, public property records, procurement
            sources and event ticket information. This page describes publicly released functionality, not unreleased
            development branches or future business commitments.
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
            A database review on 17 November 2026 observed 12,587 property records,
            4,104 published public tender records, 21,700 hotel directory entries and
            174,819 OpenStreetMap attraction records. These are source-data counts,
            not confirmed available properties, independently approved hotels, bookable attractions,
            official permissions for every source or completed commercial orders. Geographic coverage
            and freshness depend on each feed, regulator and publisher.
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
