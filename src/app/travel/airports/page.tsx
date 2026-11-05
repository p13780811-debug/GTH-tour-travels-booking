import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Globe2, MapPin, Plane, ShieldCheck } from "lucide-react";
import { airports } from "@/lib/travel/nuiteeAirportDirectory";
import AirportDiscoveryTools from "@/components/travel/AirportDiscoveryTools";

export const metadata: Metadata = {
  title: "Airport Explorer | Codes, Cities & Flight Planning | GTH PRO",
  description: "Research verified airport codes and cities worldwide, then continue to GTH PRO flights, hotels and airport transfers. No fake fares or live-price claims.",
  alternates: { canonical: "/travel/airports" },
};

const routes = [
  { origin: "CCU", destination: "BOM", label: "Kolkata to Mumbai" },
  { origin: "CCU", destination: "DEL", label: "Kolkata to Delhi" },
  { origin: "BOM", destination: "DXB", label: "Mumbai to Dubai" },
  { origin: "DEL", destination: "LHR", label: "Delhi to London" },
  { origin: "BLR", destination: "SIN", label: "Bengaluru to Singapore" },
  { origin: "MAA", destination: "BKK", label: "Chennai to Bangkok" },
];

export default function AirportExplorerPage() {
  const india = airports.filter(airport => airport.countryCode === "IN");
  const international = airports.filter(airport => airport.countryCode !== "IN");

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
            <Globe2 size={16} aria-hidden="true" /> GTH PRO · Travel discovery
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Find the right airport before you book.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
            Explore airport names, IATA codes and local time zones using a curated
            directory verified against Nuitee Connect airport reference data.
            Continue to GTH PRO&apos;s existing flight and travel services for live booking searches.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/flights" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              Open flight search <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/travel" className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold">
              Travel hub
            </Link>
          </div>
        </div>
      </section>

      <AirportDiscoveryTools />

      <section aria-labelledby="popular-routes" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <h2 id="popular-routes" className="text-xl font-bold md:text-2xl">Explore route ideas</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map(route => (
            <Link key={route.origin + route.destination} href={`/flights?origin=${route.origin}&destination=${route.destination}`}
              className="gth-glass group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-semibold">
              <span>{route.label} <span className="block pt-1 text-xs text-[var(--text-soft)]">{route.origin} → {route.destination}</span></span>
              <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {[
        { title: "Featured airport guides in India", items: india },
        { title: "Featured international airport guides", items: international },
      ].map(group => (
        <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-")} className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <h2 id={group.title.replaceAll(" ", "-")} className="flex items-center gap-2 text-2xl font-bold">
            <MapPin size={22} aria-hidden="true" /> {group.title}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(airport => (
              <Link href={`/travel/airports/${airport.code.toLowerCase()}`} key={airport.code}
                className="gth-glass group flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--border)] p-5">
                <div>
                  <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold">{airport.code}</span>
                  <h3 className="mt-4 text-lg font-bold leading-7">{airport.name}</h3>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{airport.city}, {airport.country}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{airport.description}</p>
                </div>
                <span className="gold-text mt-5 inline-flex items-center gap-2 text-sm font-semibold">Airport guide <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            { href: "/flights", label: "Flights", detail: "Use the existing flight booking search.", Icon: Plane },
            { href: "/hotels", label: "Hotels", detail: "Find accommodation using the existing hotel service.", Icon: Compass },
            { href: "/transfers", label: "Airport transfers", detail: "Check ground transport arrangements.", Icon: ShieldCheck },
          ].map(({ href, label, detail, Icon }) => (
            <Link href={href} key={href} className="gth-glass rounded-2xl border border-[var(--border)] p-5">
              <Icon size={22} aria-hidden="true" /><h2 className="mt-3 text-lg font-bold">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{detail}</p>
              <span className="gold-text mt-4 inline-flex items-center gap-2 text-sm font-semibold">Explore <ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
