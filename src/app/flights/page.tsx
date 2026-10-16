import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Compass, PlaneTakeoff } from "lucide-react";
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
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]" data-gth-flight-page="true">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)] bg-[var(--card)]">
        <div aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden opacity-45 [mask-image:linear-gradient(to_right,transparent,black_18%)] sm:block">
          <Image src="/images/mega/flights.jpg" alt="" fill priority
            sizes="(max-width: 1024px) 35vw, 580px" className="object-cover object-center" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:py-14">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
              GTH PRO · Worldwide travel
            </p>
            <h1 className="mt-3 text-[var(--text)]">Find your next flight</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-soft)]">
              Search flights with Aviasales, then explore airport transfers, car rentals and travel essentials
              in one connected GTH PRO journey.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[var(--gold)]" /> International destinations</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[var(--gold)]" /> Provider-operated checkout</span>
            </div>
          </div>
          <nav aria-label="Flight travel categories"
            className="mt-7 flex max-w-4xl snap-x gap-2 overflow-x-auto rounded-2xl bg-transparent pb-2 text-xs shadow-none">
            {[
              { name: "Search flights", href: "#flight-search" },
              { name: "Airport services", href: "/transfers" },
              { name: "Car rentals", href: "/cars" },
              { name: "Insurance", href: "/insurance" },
              { name: "Hotels", href: "/hotels" },
              { name: "Tours", href: "/tours" },
              { name: "Destinations", href: "/destinations" },
            ].map((item) => (
              <Link key={item.name} href={item.href}
                className="inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--gold)]">
                {item.name} <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9">
        {destination && origin !== destination && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm shadow-sm">
            <PlaneTakeoff size={18} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <p>
              Route inspiration: <strong>{origin} → {destination}</strong>. Choose these airports and
              your travel dates in the supplier search form to see matching offers.
            </p>
          </div>
        )}
        <AviasalesWhiteLabel />
        <FlightJourneyServices />
        <PopularDestinations destinations={flightDestinations} origin={origin} />

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
          <h2 className="flex items-center gap-2"><Compass size={18} aria-hidden="true" /> About flight bookings</h2>
          <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
            Search and results are operated by Aviasales/Travelpayouts. The GTH PRO historical fare
            API is not displayed as live bookable inventory. Final availability, fares, baggage,
            payment and support are determined by the chosen provider.
          </p>
        </section>
      </div>
    </main>
  );
}
