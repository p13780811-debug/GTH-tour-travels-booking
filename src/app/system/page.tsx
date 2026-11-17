import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Compass, Globe2, Landmark, ShieldCheck, Ticket } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "How GTH PRO Works | Four Connected Discovery Platforms",
  description: "Explore GTH PRO's independent real estate tools, travel supplier handoffs, public tender research and worldwide event ticket sources, with data and verification boundaries.",
  alternates: { canonical: "/system" },
  openGraph: {
    title: "How GTH PRO Works | Global Technical Hub",
    description: "A transparent overview of first-party research, public-source data and third-party supplier handoffs across four digital platforms.",
    url: "/system",
    type: "website"
  }
};

const platforms = [
  {
    name: "Real Estate",
    Icon: Building2,
    description: "Explore property markets, distinguish public project registry records from reviewed marketplace listings, and use buyer planning tools. Listing, ownership and title status require separate verification.",
    links: [
      { name: "Explore properties", href: "/real-estate" },
      { name: "Project registry", href: "/real-estate/registry" },
      { name: "Buyer tools", href: "/real-estate/tools" }
    ]
  },
  {
    name: "Travel",
    Icon: Compass,
    description: "Research hotels, flights, transfers, tours, cruises and destinations. Some journeys use supplier-hosted booking experiences; others lead to an affiliate or source page. Final price and fulfilment belong to the selected provider.",
    links: [
      { name: "Discover travel", href: "/travel" },
      { name: "Explore hotels", href: "/hotels" },
      { name: "Tours and experiences", href: "/tours" }
    ]
  },
  {
    name: "Tender Intelligence",
    Icon: Landmark,
    description: "Research source-attributed public procurement opportunities and use preparation guidance. Tender eligibility, procurement decisions and filing must be verified with the issuing authority.",
    links: [
      { name: "Tender gateway", href: "/tender" },
      { name: "Tender services", href: "/tender/services" },
      { name: "Tender knowledge", href: "/knowledge/tenders" }
    ]
  },
  {
    name: "Worldwide Tickets",
    Icon: Ticket,
    description: "Explore independent stadium, venue and event ticket-source guides for sports, concerts and more. A listed source is not proof of ticket availability, guaranteed admission or seller endorsement.",
    links: [
      { name: "Ticket finder", href: "/tickets" },
      { name: "Stadium guides", href: "/stadiums" },
      { name: "Ticket buying guides", href: "/blog" }
    ]
  }
] as const;

const models = [
  {
    title: "First-party research and tools",
    description: "GTH PRO publishes navigation, editorial guides, comparisons, buyer and bid preparation interfaces, and source-labelled directory pages. Available coverage is not the same as verified inventory."
  },
  {
    title: "Public-source data",
    description: "Public registry and procurement references should be checked against their issuing source. Community-mapped OpenStreetMap places are credited under the applicable source licence and do not establish live tickets or verified photos."
  },
  {
    title: "Supplier-operated travel journeys",
    description: "A White Label booking entry, a tracked affiliate referral and a public supplier information link are different relationships. Suppliers control their own availability, checkout, payment, tickets, cancellations and refunds."
  }
] as const;

export default function SystemPage() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]"><Globe2 size={17} aria-hidden="true" /> GTH PRO Global · Public platform overview</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">One connected ecosystem. Four independent discovery platforms.</h1>
        <p className="mt-6 max-w-4xl text-base leading-8 text-[var(--text-soft)]">GTH PRO (Global Technical Hub) is a digital initiative of Etios Profession. It brings first-party research and planning interfaces together with source-attributed information and supplier-operated handoffs. Affiliate referrals are one part of the platform, not its entire operating model.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/verification" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold">Verification & transparency <ArrowUpRight size={17} /></Link>
          <Link href="/about" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-5 font-semibold">About GTH PRO</Link>
        </div>
      </div>
    </header>

    <section aria-labelledby="four-platforms" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h2 id="four-platforms" className="text-2xl font-semibold">Explore the real public workflows</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">Each platform has its own entry points, research tools and limitations. Features and geographic coverage can vary.</p>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        {platforms.map(({ name, Icon, description, links }) => <article key={name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <Icon size={28} className="text-[var(--gold)]" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-semibold">{name}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{description}</p>
          <nav aria-label={name + " pages"} className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            {links.map(link => <Link key={link.href} href={link.href} className="inline-flex min-h-10 items-center gap-1 text-[var(--gold)] underline">{link.name} <ArrowUpRight size={14}/></Link>)}
          </nav>
        </article>)}
      </div>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--card)]/60" aria-labelledby="platform-models">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 id="platform-models" className="text-2xl font-semibold">How information and booking handoffs work</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {models.map(model => <article key={model.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <h3 className="text-lg font-semibold">{model.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{model.description}</p>
          </article>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/affiliate-disclosure" className="text-[var(--gold)] underline">Affiliate disclosure</Link>
          <Link href="/gth-ecosystem-manifest" className="text-[var(--gold)] underline">Full ecosystem manifest</Link>
          <Link href="/attractions" className="text-[var(--gold)] underline">Public attraction directory</Link>
          <Link href="/verification" className="text-[var(--gold)] underline">Supplier and source transparency</Link>
        </div>
      </div>
    </section>

    <section aria-labelledby="boundaries" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h2 id="boundaries" className="flex items-center gap-2 text-2xl font-semibold"><ShieldCheck size={23} className="text-[var(--gold)]" aria-hidden="true" /> Independent and transparent by design</h2>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">GTH PRO is not an airline, government procurement portal, official property title registry or a guarantee of ticket stock. A live public listing does not by itself establish government approval, verified ownership, seller authority or confirmed booking inventory. Public source and supplier information is distinct from private application systems; no proprietary credentials or customer records are published here.</p>
      <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--text-soft)]">Public trust should be evaluated through documented features, source provenance, transparent supplier handoffs and a reachable official contact—not assumptions about staffing or registration based on social media or hosting labels. We distinguish first-party tools from provider-operated services and do not claim unverified registrations or certifications.</p>
      <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">Business enquiries: <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="font-semibold text-[var(--gold)] underline">{SITE_CONFIG.contactEmail}</a>. For use restrictions and data handling, read our <Link href="/privacy-policy" className="font-semibold text-[var(--gold)] underline">Privacy Policy</Link> and <Link href="/terms-and-conditions" className="font-semibold text-[var(--gold)] underline">Terms and Conditions</Link>.</p>
    </section>
  </main>;
}
