import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, Globe2, Plane, BriefcaseBusiness, Compass, ShieldCheck, MapPin, TrainFront } from "lucide-react";

const pillars = [
  {
    id: "travel",
    number: "01",
    title: "Tours & Travels",
    eyebrow: "Global discovery & mobility",
    description: "International flight discovery, hotels, travel experiences and destination research in one connected travel platform.",
    href: "/travel",
    cta: "Explore Travel",
    image: "/images/travel.jpg",
    Icon: Plane,
    detail: "Flights · Hotels · Tours",
  },
  {
    id: "real-estate",
    number: "02",
    title: "Real Estate",
    eyebrow: "Property intelligence",
    description: "Explore property discovery, market information and listing tools on our independently maintained Real Estate platform.",
    href: "/real-estate",
    cta: "Explore Real Estate",
    image: "/images/real-estate.jpg",
    Icon: Building2,
    detail: "Properties · Markets · Listings",
  },
  {
    id: "tender",
    number: "03",
    title: "Tenders",
    eyebrow: "Procurement intelligence · Developing",
    description: "An emerging workspace for procurement research, bid readiness and government opportunity discovery. The tender catalog is in development.",
    href: "/tender",
    cta: "Explore Tender Vision",
    image: "/images/tender.jpg",
    Icon: BriefcaseBusiness,
    detail: "Research · Readiness · Sources",
  },
] as const;

const quickLinks = [
  { title: "Flights", href: "/flights", Icon: Plane },
  { title: "Hotels", href: "/hotels", Icon: Building2 },
  { title: "Destinations", href: "/destinations", Icon: MapPin },
  { title: "Tours", href: "/tours", Icon: Compass },
  { title: "Rail & Transit", href: "/train", Icon: TrainFront },
  { title: "Travel Protection", href: "/insurance", Icon: ShieldCheck },
] as const;

export default function EcosystemPillars() {
  return (
    <section id="ecosystem-pillars" aria-labelledby="ecosystem-pillar-heading" className="relative scroll-mt-20 overflow-hidden bg-[var(--bg)] py-14 md:py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 rounded-full bg-[var(--gold)]/5 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-9 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold)]"><Globe2 size={16} aria-hidden="true" /> GTH PRO · Global Technical Hub</p>
            <h1 id="ecosystem-pillar-heading" className="gth-master-heading mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl">
              One global ecosystem. <span className="gold-text">Three defining pillars.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
              From journeys to property discovery and procurement research—navigate the entire GTH PRO world from one central gateway.
            </p>
          </div>
          <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">
            Connect with GTH PRO <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {pillars.map(({id,number,title,eyebrow,description,href,cta,image,Icon,detail}) => (
            <article key={id} className="gth-master-pillar group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition-[transform,border-color] duration-300 motion-safe:hover:-translate-y-1 hover:border-[var(--gold)] focus-within:ring-2 focus-within:ring-[var(--gold)]">
              {/* Keep the source photo visible instead of hiding it beneath a full-card black gradient. */}
              <div className="relative h-40 shrink-0 overflow-hidden bg-[var(--bg-soft)] sm:h-44 md:h-48">
                <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4" aria-hidden="true">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-strong)] text-[var(--text)] backdrop-blur-sm"><Icon size={20} /></span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[var(--text)] backdrop-blur-sm">PILLAR {number}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">{eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
                <div className="mt-auto pt-5">
                  <p className="border-t border-[var(--border)] pt-3 text-xs font-medium text-[var(--text-soft)]">{detail}</p>
                  <Link href={href} className="mt-4 inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                    {cta} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <nav aria-label="Popular ecosystem destinations" className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-soft)]">Quick access</span>
          {quickLinks.map(({title,href,Icon})=>(
            <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">
              <Icon size={15} aria-hidden="true" /> {title}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
