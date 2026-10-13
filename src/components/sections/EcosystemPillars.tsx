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
    image: "/images/cities/maldives.jpg",
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
    image: "/dubai.jpg",
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
    image: "/images/cities/dubai.jpg",
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
            <h1 id="ecosystem-pillar-heading" className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl">
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
            <article key={id} className="group relative isolate min-h-[365px] overflow-hidden rounded-[28px] border border-white/15 bg-slate-950 text-white shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[var(--gold)] md:min-h-[415px]">
              <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/80 to-black/15" aria-hidden="true" />
              <div className="flex h-full flex-col justify-between p-6 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-black/25 backdrop-blur"><Icon size={21} aria-hidden="true" /></span>
                  <span className="text-xs font-semibold tracking-[0.22em] text-white/75">PILLAR {number}</span>
                </div>
                <div className="mt-16">
                  <p className="text-xs font-semibold uppercase tracking-[0.17em] text-amber-200">{eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/85">{description}</p>
                  <p className="mt-4 border-t border-white/20 pt-4 text-xs font-medium text-white/65">{detail}</p>
                  <Link href={href} className="mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20">
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
