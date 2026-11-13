import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { ArrowUpRight, Building2, Globe2, Hotel, Landmark, ShieldCheck, Ticket } from "lucide-react";

export const metadata: Metadata = {
  title: "Official Website Verification & Transparency | GTH PRO",
  description: "Verify the public identity of GTH PRO, its four digital platforms, travel white-label and affiliate model, open-source attraction data and independent booking disclosures.",
  alternates: { canonical: "/verification" },
  openGraph: {
    title: "GTH PRO | Official Website Verification & Transparency",
    description: "GTH PRO platform identity, independent supplier handoffs, data provenance and publicly accessible trust policies.",
    url: "/verification",
    type: "website"
  }
};

const pillars = [
  {
    name: "Real estate analytics and discovery",
    href: "/real-estate",
    Icon: Building2,
    description: "Source-attributed property research, market context, listing workflows and project information. A marketplace listing is not automatically a title, ownership or regulatory verification."
  },
  {
    name: "Travel technology and partner discovery",
    href: "/travel",
    Icon: Hotel,
    description: "Hotels, travel destinations, experiences, transport and supplier handoffs. Live rooms, tickets, availability, price and payment terms are determined by the applicable external provider."
  },
  {
    name: "Public tender intelligence",
    href: "/tender",
    Icon: Landmark,
    description: "Source-aware public procurement research and tender preparation guidance. GTH PRO is not a government tender portal or issuing authority; official source documents control eligibility and submission."
  },
  {
    name:"Worldwide tickets and stadium source research",
    href:"/tickets",
    Icon:Ticket,
    description:"Public event ticket-source discovery, stadium/venue guides and ticket buying research. GTH PRO does not guarantee ticket inventory, admission, prices or seller authorization."
  }
] as const;

export default function VerificationPage() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
          <ShieldCheck size={18} aria-hidden="true"/> Identity and platform transparency
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">Verify GTH PRO Global</h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-[var(--text-soft)]">
          GTH PRO (Global Technical Hub) is a digital initiative of Etios Profession, connecting four
          independent areas of discovery: real estate, travel technology, public tenders and worldwide ticket-source research.
          This is the official GTH PRO website. We publish our actual services, source limitations
          and supplier handoff model to help visitors evaluate the platform.
        </p>
        <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">
          Official website: <a href="https://www.gthproglobal.com/" className="font-semibold text-[var(--gold)] underline">www.gthproglobal.com</a>
          {" · "}Business enquiries: <a href={"mailto:"+SITE_CONFIG.contactEmail} className="font-semibold text-[var(--gold)] underline">{SITE_CONFIG.contactEmail}</a>
        </p>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8" aria-labelledby="platforms">
      <h2 id="platforms" className="text-2xl font-semibold">Four connected digital platforms</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {pillars.map(({name,href,description,Icon})=>
          <article key={href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <Icon size={27} className="text-[var(--gold)]" aria-hidden="true"/>
            <h3 className="mt-4 text-lg font-semibold">{name}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{description}</p>
            <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--gold)]">Explore platform <ArrowUpRight size={16}/></Link>
          </article>
        )}
      </div>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--card)]" aria-labelledby="travel-verification">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="travel-verification" className="text-2xl font-semibold">Travel infrastructure and supplier relationships</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">
          GTH PRO combines its own research and navigation experience with separately operated supplier services.
          Our public pages distinguish white-label technology, affiliate search/referrals and independently supplied products.
          The presence of a logo or outbound link does not mean every product is individually approved,
          bookable or fulfilled by GTH PRO.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <h3 className="font-semibold">Nuitee hotel White Label</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Our branded hotel booking entry uses a Nuitee-hosted White Label configuration at
              <span className="font-medium"> hotel.gthproglobal.com</span>. Booking inventory, payments,
              cancellations and confirmed availability follow the supplier's own terms.
            </p>
            <a href="https://hotel.gthproglobal.com/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] underline" target="_blank" rel="noopener noreferrer">Open hotel White Label <ArrowUpRight size={15}/></a>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <h3 className="font-semibold">GetYourGuide referrals</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              GTH PRO provides tracked GetYourGuide search links and certain product links.
              An affiliate referral is not a claim of exclusive agency or verified availability
              for every attraction. Products, dates and checkout are controlled by the provider.
            </p>
            <Link href="/cruises" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">See experience discovery <ArrowUpRight size={15}/></Link>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <h3 className="font-semibold">WeGoTrip supplier discovery</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Source-backed WeGoTrip audio tours and ticket products are discoverable through our Tours
              experience. Travelpayouts affiliate referrals and supplier product pages are different
              handoff types and are not represented as GTH-issued tickets.
            </p>
            <Link href="/tours" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">Browse tours <ArrowUpRight size={15}/></Link>
          </article>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8" aria-labelledby="sources">
      <h2 id="sources" className="flex items-center gap-2 text-2xl font-semibold"><Globe2 className="text-[var(--gold)]" size={24}/> Attraction data, search indexing and source rights</h2>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">
        GTH PRO maintains a large-scale OpenStreetMap (OSM) community attraction directory, with source attribution
        under the Open Database Licence (ODbL). Pages are served on demand and cached; a mapped place is
        not automatically a live ticket, official venue verification or licensed promotional photograph.
        An on-demand URL does not mean every source record qualifies for search indexing. Published,
        indexable pages are subject to quality and publication gates.
      </p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        <Link href="/attractions" className="text-[var(--gold)] underline">Explore mapped attractions</Link>
        <Link href="/attractions/progress" className="text-[var(--gold)] underline">View catalog source progress</Link>
        <a href="https://www.openstreetmap.org/copyright" className="text-[var(--gold)] underline" rel="noopener noreferrer" target="_blank">OpenStreetMap attribution and licence</a>
      </div>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--card)]" aria-labelledby="policies">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="policies" className="text-2xl font-semibold">Legal, commercial and technical boundaries</h2>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">
          Public content can be crawled without disclosing private databases, administrative controls,
          provider secrets or security configurations. Access to private systems is governed by separate
          application controls. We do not assert government affiliation, guaranteed rankings, a registered
          certification, audited property title, or confirmed supplier approval unless separately established.
          This page explains our operations; it is not an independent regulatory certification.
        </p>
        <nav className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold" aria-label="Verification policies">
          <Link href="/about" className="text-[var(--gold)] underline">About</Link>
          <Link href="/affiliate-disclosure" className="text-[var(--gold)] underline">Affiliate disclosure</Link>
          <Link href="/privacy-policy" className="text-[var(--gold)] underline">Privacy policy</Link>
          <Link href="/terms-and-conditions" className="text-[var(--gold)] underline">Terms and conditions</Link>
          <Link href="/refund-policy" className="text-[var(--gold)] underline">Refund policy</Link>
          <Link href="/contact" className="text-[var(--gold)] underline">Contact and business enquiries</Link>
        </nav>
      </div>
    </section>
  </main>;
}
