import Link from "next/link";
import { ArrowUpRight, Compass, Plane } from "lucide-react";
import AviasalesWhiteLabel from "@/components/flights/AviasalesWhiteLabel";
import FlightJourneyServices from "@/components/flights/FlightJourneyServices";
import PopularDestinations from "@/components/flights/PopularDestinations";
import { flightDestinations } from "@/data/flight/destinations";

type Props = { searchParams: Promise<{ origin?: string; destination?: string }> };

export default async function FlightsPage({ searchParams }: Props) {
  const query = await searchParams;
  const origin = /^[A-Z]{3}$/.test(query.origin || "") ? query.origin! : "CCU";
  const destination = /^[A-Z]{3}$/.test(query.destination || "") ? query.destination! : "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <section className="border-b border-[var(--border)] bg-[var(--card)]/60">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            GTH PRO · Worldwide flight booking discovery
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            Flights, airports and your whole journey.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
            Search real supplier results using the Aviasales Travelpayouts White Label on this page.
            Continue to airport pickup, travel insurance, car rental, tours and destination services.
          </p>
          <nav aria-label="Flight categories" className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2 text-sm">
            {[
              { name: "Search flights", href: "#flight-search" },
              { name: "Airport transfers", href: "/transfers" },
              { name: "Car rentals", href: "/cars" },
              { name: "Travel insurance", href: "/insurance" },
              { name: "Hotels", href: "/hotels" },
              { name: "Tours", href: "/tours" },
            ].map((item) => (
              <Link key={item.name} href={item.href}
                className="gth-glass inline-flex min-h-10 shrink-0 snap-start items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">
                {item.name} <ArrowUpRight size={13} className="ml-2" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6">
        {destination && origin !== destination && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
            <Plane size={19} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <p>
              Route inspiration: <strong>{origin} → {destination}</strong>.
              Select these airports and your dates in the Aviasales search form below for
              supplier results; this preview does not preselect an unconfirmed fare.
            </p>
          </div>
        )}
        <AviasalesWhiteLabel />

        <section className="mt-10">
          <h2 className="text-xl font-bold sm:text-2xl">Continue planning after booking</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
            Air transport is only one part of the trip. The airport and destination sections below
            connect the services linked to the GTH PRO ecosystem.
          </p>
        </section>
        <FlightJourneyServices />
        <PopularDestinations destinations={flightDestinations} origin={origin} />

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-xs leading-6 text-[var(--text-soft)]">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--text)]">
            <Compass size={18} aria-hidden="true" /> About the flight results
          </h2>
          <p>
            The embedded White Label is operated by Aviasales/Travelpayouts and displays provider
            results when its service is available. The separate GTH PRO Data API contains historical
            observations only and is no longer used as the primary booking UI.
            Final fares, availability, support and purchase conditions are supplied by ticket sellers.
          </p>
        </section>
      </div>
    </main>
  );
}
