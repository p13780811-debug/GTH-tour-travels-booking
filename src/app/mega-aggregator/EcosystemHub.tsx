"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  BusFront,
  CarFront,
  ChevronDown,
  Compass,
  FileCheck2,
  FileText,
  FileUp,
  Globe2,
  Handshake,
  Hotel,
  Landmark,
  MapPinned,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  Ticket,
  TrainFront,
} from "lucide-react";

/**
 * The Ecosystem page is a directory, not a second implementation of existing
 * provider search / ticketing engines. All destinations are real GTH PRO routes.
 * No synthetic offers, prices, reviews, inventory, ratings or bookings.
 * This component is imported ONLY from /mega-aggregator.
 */
type Pillar = "travel" | "property" | "tender" | "business";
type Selection = "all" | Exclude<Pillar, "business">;

const filters: readonly { key: Selection; label: string }[] = [
  { key: "all", label: "All services" },
  { key: "travel", label: "Travel" },
  { key: "property", label: "Real Estate" },
  { key: "tender", label: "Tenders" },
];

const services = [
  { label: "Hotels", href: "/hotels", pillar: "travel", Icon: Hotel },
  { label: "Flights", href: "/flights", pillar: "travel", Icon: Plane },
  { label: "Trains", href: "/train", pillar: "travel", Icon: TrainFront },
  { label: "Buses", href: "/bus", pillar: "travel", Icon: BusFront },
  { label: "Ferries", href: "/ferry", pillar: "travel", Icon: Ship },
  { label: "Tours", href: "/tours", pillar: "travel", Icon: Compass },
  { label: "Activities", href: "/activities", pillar: "travel", Icon: Ticket },
  { label: "Airport transfers", href: "/transfers", pillar: "travel", Icon: CarFront },
  { label: "Car rentals", href: "/cars", pillar: "travel", Icon: CarFront },
  { label: "Travel insurance", href: "/insurance", pillar: "travel", Icon: ShieldCheck },
  { label: "Destinations", href: "/destinations", pillar: "travel", Icon: MapPinned },
  { label: "Travel guides", href: "/guides", pillar: "travel", Icon: BookOpen },
  { label: "Travel articles", href: "/blog", pillar: "travel", Icon: FileText },
  { label: "Properties", href: "/real-estate", pillar: "property", Icon: Building2 },
  { label: "Registry research", href: "/real-estate/registry", pillar: "property", Icon: Landmark },
  { label: "Property tools", href: "/real-estate/tools", pillar: "property", Icon: Search },
  { label: "Post property", href: "/real-estate/post-property", pillar: "property", Icon: FileUp },
  { label: "Claim project", href: "/real-estate/claim-project", pillar: "property", Icon: FileCheck2 },
  { label: "Tender search", href: "/tender", pillar: "tender", Icon: BriefcaseBusiness },
  { label: "Tender services", href: "/tender/services", pillar: "tender", Icon: FileCheck2 },
  { label: "Become a partner", href: "/partners", pillar: "business", Icon: Handshake },
  { label: "Contact GTH PRO", href: "/contact", pillar: "business", Icon: Globe2 },
] as const;

type Highlight = {
  title: string;
  description: string;
  href: string;
  pillar: Exclude<Pillar, "business">;
  image?: string;
  Icon: typeof Plane;
  eyebrow: string;
};

const highlights: Highlight[] = [
  {
    title: "Discover your next stay",
    description: "Explore hotels and continue with the connected booking provider.",
    href: "/hotels", pillar: "travel", image: "/images/mega/hotels.jpg",
    Icon: Hotel, eyebrow: "Stays",
  },
  {
    title: "Explore flight connections",
    description: "Search flights and check final fare conditions before booking.",
    href: "/flights", pillar: "travel", image: "/images/mega/flights.jpg",
    Icon: Plane, eyebrow: "Flights",
  },
  {
    title: "Tours and experiences",
    description: "Discover activities, attractions and guided experiences.",
    href: "/tours", pillar: "travel", image: "/images/mega/tours.jpg",
    Icon: Compass, eyebrow: "Experiences",
  },
  {
    title: "Bus, rail and sea journeys",
    description: "Find the right booking route for supported ground and ferry travel.",
    href: "/bus", pillar: "travel", Icon: TrainFront, eyebrow: "Transport",
  },
  {
    title: "Explore property research",
    description: "GTH PRO has a worldwide scope; registry coverage expands as verified sources are added.",
    href: "/real-estate", pillar: "property", Icon: Building2, eyebrow: "Real Estate",
  },
  {
    title: "Check MahaRERA records",
    description: "Research currently available Maharashtra projects without treating records as sale listings.",
    href: "/real-estate/registry", pillar: "property", Icon: Landmark, eyebrow: "Project research",
  },
  {
    title: "Explore tender opportunities",
    description: "Browse opportunities and verify eligibility and official source details.",
    href: "/tender", pillar: "tender", Icon: BriefcaseBusiness, eyebrow: "Tender intelligence",
  },
  {
    title: "Request tender assistance",
    description: "Ask for a written quote for eligibility, document or procurement support.",
    href: "/tender/services", pillar: "tender", Icon: FileCheck2, eyebrow: "Business services",
  },
];

const usefulGroups = [
  {
    heading: "Popular destinations in India",
    links: [
      { text: "Mumbai", href: "/destinations/mumbai" },
      { text: "Goa", href: "/destinations/goa" },
      { text: "Digha", href: "/destinations/digha" },
      { text: "Puri", href: "/destinations/puri" },
      { text: "Bengaluru", href: "/destinations/bengaluru" },
    ],
  },
  {
    heading: "Popular international destinations",
    links: [
      { text: "Bali", href: "/destinations/bali" },
      { text: "Bangkok", href: "/destinations/bangkok" },
      { text: "Dubai", href: "/destinations/dubai" },
      { text: "Paris", href: "/destinations/paris" },
      { text: "Explore all destinations", href: "/destinations" },
    ],
  },
  {
    heading: "Hotels, flights and experiences",
    links: [
      { text: "Search hotels", href: "/hotels" },
      { text: "Search flights", href: "/flights" },
      { text: "Tours", href: "/tours" },
      { text: "Activities", href: "/activities" },
      { text: "Travel guides", href: "/guides" },
    ],
  },
  {
    heading: "Bus, train, ferry and transfers",
    links: [
      { text: "Bus journeys", href: "/bus" },
      { text: "Global train journeys", href: "/train" },
      { text: "Ferry and island connections", href: "/ferry" },
      { text: "Airport transfers", href: "/transfers" },
      { text: "Car rentals", href: "/cars" },
    ],
  },
  {
    heading: "Global real estate",
    links: [
      { text: "Explore properties", href: "/real-estate" },
      { text: "Project registry research", href: "/real-estate/registry" },
      { text: "Property tools", href: "/real-estate/tools" },
      { text: "Submit a listing", href: "/real-estate/post-property" },
      { text: "Claim your project", href: "/real-estate/claim-project" },
    ],
  },
  {
    heading: "Tenders and procurement",
    links: [
      { text: "Explore tender opportunities", href: "/tender" },
      { text: "Tender business assistance", href: "/tender/services" },
      { text: "Contact GTH PRO", href: "/contact" },
    ],
  },
  {
    heading: "Travel advice and protection",
    links: [
      { text: "Travel insurance", href: "/insurance" },
      { text: "Destination guides", href: "/guides" },
      { text: "Travel articles", href: "/blog" },
      { text: "Browse destinations", href: "/destinations" },
    ],
  },
  {
    heading: "About, partners and support",
    links: [
      { text: "About GTH PRO", href: "/about" },
      { text: "Partner with us", href: "/partners" },
      { text: "Contact us", href: "/contact" },
      { text: "Privacy policy", href: "/privacy-policy" },
    ],
  },
] as const;

export default function EcosystemHub() {
  const [active, setActive] = useState<Selection>("all");
  const availableServices = services.filter(service => active === "all" || service.pillar === active);
  const availableHighlights = highlights.filter(item => active === "all" || item.pillar === active);

  return (
    <div className="w-full min-w-0 bg-[var(--bg)] text-[var(--text)]">
      <section id="ecosystem-directory" aria-labelledby="ecosystem-directory-heading" className="border-b border-[var(--border)] py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">One global ecosystem</p>
              <h2 id="ecosystem-directory-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                Everything GTH PRO, in one place.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)] sm:text-base">
                Travel, worldwide real estate discovery and tender intelligence. Select a service to access its existing search, data and tools.
              </p>
            </div>
            <nav aria-label="Ecosystem pillars" className="flex flex-wrap gap-2">
              <Link href="/travel" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">Travel</Link>
              <Link href="/real-estate" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">Real Estate</Link>
              <Link href="/tender" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">Tenders</Link>
            </nav>
          </div>

          <div aria-label="Filter ecosystem services" className="mt-6 flex max-w-full gap-2 overflow-x-auto pb-2">
            {filters.map(filter => (
              <button key={filter.key} type="button" aria-pressed={active === filter.key}
                onClick={() => setActive(filter.key)}
                className={active === filter.key
                  ? "gth-btn-gold inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm font-semibold"
                  : "inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold text-[var(--text)]"}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8" aria-live="polite">
            {availableServices.map(service => {
              const Icon = service.Icon;
              return (
                <Link key={service.href} href={service.href}
                  className="group flex min-h-28 min-w-0 flex-col items-center justify-start rounded-2xl border border-[var(--border)] bg-[var(--card)] px-1 py-3 text-center transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:min-h-32 sm:px-2 sm:py-4">
                  <span className="mb-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--gold)] transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12">
                    <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="break-words text-[11px] font-semibold leading-4 text-[var(--text)] sm:text-sm sm:leading-5">{service.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="ecosystem-highlights" aria-labelledby="ecosystem-highlights-heading" className="border-b border-[var(--border)] bg-[var(--card)]/25 py-9 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Explore the ecosystem</p>
              <h2 id="ecosystem-highlights-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Featured services and discovery</h2>
            </div>
            <span className="text-xs text-[var(--text-soft)]">Explore live pages, not sample discounts</span>
          </div>
          <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
            {availableHighlights.map(item => {
              const Icon = item.Icon;
              return (
                <Link key={item.href} href={item.href}
                  className="group flex w-[245px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-colors hover:border-[var(--gold)] sm:w-[295px]">
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[var(--bg)] sm:h-44">
                    {item.image
                      ? <Image src={item.image} alt="" fill sizes="(max-width: 640px) 245px, 295px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      : <Icon size={64} strokeWidth={1.1} className="text-[var(--gold)]" aria-hidden="true" />}
                  </div>
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{item.eyebrow}</span>
                    <h3 className="mt-1 text-base font-bold text-[var(--text)]">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
                    <span className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      Explore <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="ecosystem-links" aria-labelledby="ecosystem-links-heading" className="py-9 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">Explore more</p>
          <h2 id="ecosystem-links-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Destinations, research and useful links</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
            Open a category to reach the corresponding GTH PRO pages. Full inventories, registration research and live opportunities remain on their own search pages so this global gateway stays fast.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {usefulGroups.map((group, i) => (
              <details key={group.heading} open={i === 0 ? true : undefined}
                className="group min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[var(--text)] marker:hidden sm:px-5">
                  {group.heading}
                  <ChevronDown size={18} className="shrink-0 text-[var(--text-soft)] transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <nav aria-label={group.heading} className="grid grid-cols-1 gap-1 border-t border-[var(--border)] px-3 py-3 sm:grid-cols-2 sm:px-4">
                  {group.links.map(link => (
                    <Link key={link.href} href={link.href}
                      className="inline-flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-soft)] hover:bg-[var(--bg)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
                      {link.text}
                      <ArrowUpRight size={14} className="shrink-0" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
