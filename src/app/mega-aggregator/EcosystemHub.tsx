"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  BusFront,
  CarFront,
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
type Pillar = "travel" | "property" | "tender" | "ticket" | "business";
type Selection = "all" | Pillar;

const filters: readonly { key: Selection; label: string }[] = [
  { key: "all", label: "All services" },
  { key: "travel", label: "Travel" },
  { key: "property", label: "Real Estate" },
  { key: "tender", label: "Tenders" },
  { key: "ticket", label: "Tickets & Events" },
  { key: "business", label: "Partners & Support" },
];

const services = [
  { label: "Hotels", href: "/hotels", pillar: "travel", Icon: Hotel },
  { label: "Travel gateway", href: "/travel", pillar: "travel", Icon: Globe2 },
  { label: "AI Trip Planner", href: "/ai-trip", pillar: "travel", Icon: Compass },
  { label: "Travel deals", href: "/travel/deals", pillar: "travel", Icon: Ticket },
  { label: "Flights", href: "/flights", pillar: "travel", Icon: Plane },
  { label: "Trains", href: "/train", pillar: "travel", Icon: TrainFront },
  { label: "Buses", href: "/bus", pillar: "travel", Icon: BusFront },
  { label: "Ferries", href: "/ferry", pillar: "travel", Icon: Ship },
  { label: "Stadium Tickets", href: "/stadiums", pillar: "ticket", Icon: Ticket },
  { label: "Worldwide Ticket Finder", href: "/tickets", pillar: "ticket", Icon: Ticket },
  { label: "Sports Tickets", href: "/tickets/sports", pillar: "ticket", Icon: Ticket },
  { label: "Concert Tickets", href: "/tickets/concerts", pillar: "ticket", Icon: Ticket },
  { label: "Cruises", href: "/cruises", pillar: "travel", Icon: Ship },
  { label: "Airport Explorer", href: "/travel/airports", pillar: "travel", Icon: MapPinned },
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
  { label: "Saved properties", href: "/real-estate/saved", pillar: "property", Icon: Building2 },
  { label: "Tender search", href: "/tender", pillar: "tender", Icon: BriefcaseBusiness },
  { label: "Tender services", href: "/tender/services", pillar: "tender", Icon: FileCheck2 },
  { label: "Tender assistant", href: "/tender/assistant", pillar: "tender", Icon: BriefcaseBusiness },
  { label: "Saved tenders", href: "/tender/saved", pillar: "tender", Icon: FileCheck2 },
  { label: "Become a partner", href: "/partners", pillar: "business", Icon: Handshake },
  { label: "Partner application", href: "/partners/apply", pillar: "business", Icon: FileUp },
  { label: "Contact GTH PRO", href: "/contact", pillar: "business", Icon: Globe2 },
] as const;

// Curated entry points appear first on mobile. All services remain searchable,
// and the full directory can be expanded without repeating page menus.
const primaryServiceHrefs = new Set<string>([
  "/hotels", "/flights", "/tours", "/bus", "/train",
  "/real-estate", "/tender", "/tickets", "/partners",
]);

export default function EcosystemHub() {
  const [active, setActive] = useState<Selection>("all");
  const [serviceQuery, setServiceQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const normalizedQuery = serviceQuery.trim().toLowerCase();
  const availableServices = services.filter(service =>
    (active === "all" || service.pillar === active) &&
    (!normalizedQuery || (service.label + " " + service.pillar).toLowerCase().includes(normalizedQuery))
  );
  const defaultDirectory = active === "all" && !normalizedQuery;
  const visibleServices = defaultDirectory && !showAll
    ? availableServices.filter(service => primaryServiceHrefs.has(service.href))
    : availableServices;

  return (
    <div className="w-full min-w-0 text-[var(--text)]">
      <section id="ecosystem-directory" aria-labelledby="ecosystem-directory-heading" className="border-b border-[var(--border)] py-8 sm:py-12">
        <div className="mx-auto w-full max-w-7xl min-w-0 px-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">One global ecosystem</p>
              <h2 id="ecosystem-directory-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
                Everything GTH PRO, in one place.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)] sm:text-base">
                Travel, worldwide real estate discovery, tender intelligence and worldwide event tickets. Select a service to access its existing search, data and tools.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <label htmlFor="ecosystem-services-filter" className="block w-full min-w-0 max-w-xl text-xs font-semibold text-[var(--text-soft)]">
              Filter available GTH PRO services
              <input id="ecosystem-services-filter" type="search" maxLength={60}
                value={serviceQuery} onChange={event => setServiceQuery(event.target.value)}
                placeholder="Hotel, bus, property, tender, partner…"
                className="gth-input mt-2 min-h-11 w-full min-w-0" />
            </label>
            {(serviceQuery || active !== "all") &&
              <button type="button" onClick={() => {setServiceQuery("");setActive("all");}}
                className="gth-btn min-h-11 rounded-xl px-4 text-xs font-semibold">Clear filters</button>}
          </div>
          <div aria-label="Filter ecosystem services" className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-2">
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

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" aria-live="polite">
            {visibleServices.map(service => {
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
          {defaultDirectory && availableServices.length > visibleServices.length &&
            <button type="button" className="gth-btn mt-5 inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold"
              onClick={() => setShowAll(true)}>
              View all {availableServices.length} services
            </button>}
          {defaultDirectory && showAll &&
            <button type="button" className="gth-btn mt-5 inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold"
              onClick={() => setShowAll(false)}>
              Show essential services
            </button>}
          {availableServices.length === 0 && <p role="status" className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">No matching service. Clear filters or use universal search above.</p>}
        </div>
      </section>

    </div>
  );
}
