import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { FlightDestination } from "@/data/flight/destinations";

export default function PopularDestinations({
  destinations = [],
  origin = "CCU",
  departDate = "",
  returnDate = "",
}: {
  destinations?: FlightDestination[];
  origin?: string;
  departDate?: string;
  returnDate?: string;
}) {
  if (!destinations.length) return null;
  const originCode = /^[A-Z]{3}$/.test(origin) ? origin : "CCU";
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const localISO = (date: Date) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
  const chosenDate = /^\d{4}-\d{2}-\d{2}$/.test(departDate) && departDate >= localISO(now) ? departDate : localISO(tomorrow);
  const chosenReturn = /^\d{4}-\d{2}-\d{2}$/.test(returnDate) && returnDate >= chosenDate ? returnDate : "";

  return (
    <section aria-label="Explore flight destinations" className="mt-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">Popular places to explore</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Get inspired, choose your dates and discover available fare observations.</p>
        </div>
        <Link href="/destinations" className="text-sm font-semibold underline">All destinations</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {destinations.map((destination) => {
          if (originCode === destination.destination) return null;
          const query = new URLSearchParams({ origin: originCode, destination: destination.destination, depart_date: chosenDate });
          if (chosenReturn) query.set("return_date", chosenReturn);
          return (
            <Link
              key={destination.destination}
              href={`/flights?${query.toString()}#flight-results`}
              aria-label={`View flight results from ${originCode} to ${destination.name} on ${chosenDate}`}
              className="gth-glass group min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-3">
                <p className="flex items-center justify-between gap-1 text-sm font-semibold">
                  {destination.name}<ArrowUpRight size={16} aria-hidden="true" />
                </p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">{destination.description}</p>
                <p className="mt-2 text-xs text-[var(--text-soft)]">{originCode} → {destination.destination}</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">{departDate ? "Departure" : "Tomorrow (default)"} · {chosenDate}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[var(--text-soft)]">Routes open their results for the shown date; change the date in the search form. These are not priced offers.</p>
    </section>
  );
}
