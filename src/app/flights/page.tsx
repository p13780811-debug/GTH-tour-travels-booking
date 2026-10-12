"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Clock3, Compass, Filter, Plane, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import FlightHero from "@/components/flights/FlightHero";
import PopularDestinations from "@/components/flights/PopularDestinations";
import { flightDestinations } from "@/data/flight/destinations";
import type { FareOption } from "@/lib/flights/fare-search";

type FlightSearchResponse = {
  results: FareOption[];
  checkedAt: string;
  notice: string;
  dataType: "cached_observations";
  currency: "INR";
};
type Sort = "price-asc" | "price-desc" | "duration" | "departure";
type Stops = "all" | "direct" | "one-stop";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function localDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function duration(minutes: number | null) {
  if (minutes === null) return "Duration not reported";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function FlightsContent() {
  const params = useSearchParams();
  const origin = (params.get("origin") || "").toUpperCase();
  const destination = (params.get("destination") || "").toUpperCase();
  const departDate = params.get("depart_date") || "";
  const returnDate = params.get("return_date") || "";
  const hasSearch = Boolean(origin || destination || departDate || returnDate);
  const validSearch = /^[A-Z]{3}$/.test(origin) && /^[A-Z]{3}$/.test(destination) &&
    origin !== destination && /^\d{4}-\d{2}-\d{2}$/.test(departDate) &&
    departDate >= localDate() && (!returnDate || (/^\d{4}-\d{2}-\d{2}$/.test(returnDate) && returnDate >= departDate));
  const [results, setResults] = useState<FareOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [airline, setAirline] = useState("all");
  const [stops, setStops] = useState<Stops>("all");
  const [sort, setSort] = useState<Sort>("price-asc");

  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    setError("");
    setCheckedAt("");
    setAirline("all");
    setStops("all");
    setSort("price-asc");
    if (!validSearch) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    async function load() {
      try {
        const query = new URLSearchParams({ origin, destination, depart_date: departDate });
        if (returnDate) query.set("return_date", returnDate);
        const response = await fetch(`/api/flights/search?${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const data: FlightSearchResponse = await response.json();
        if (!Array.isArray(data.results) || data.dataType !== "cached_observations" ||
            data.currency !== "INR") throw new Error();
        if (!controller.signal.aborted) {
          setResults(data.results);
          setCheckedAt(data.checkedAt);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Fare information could not be retrieved. Please try another date or search again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [origin, destination, departDate, returnDate, validSearch]);

  const airlines = useMemo(() =>
    [...new Set(results.map((item) => item.airlineCode).filter((code): code is string => Boolean(code)))].sort(),
    [results],
  );
  const filtered = useMemo(() => {
    const selected = results.filter((fare) => {
      if (airline !== "all" && fare.airlineCode !== airline) return false;
      if (stops === "direct" && fare.transfers !== 0) return false;
      if (stops === "one-stop" && fare.transfers !== 1) return false;
      return true;
    });
    return selected.sort((a, b) => {
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "duration") return (a.durationMinutes ?? Infinity) - (b.durationMinutes ?? Infinity) || a.price - b.price;
      if (sort === "departure") return a.departureAt.localeCompare(b.departureAt) || a.price - b.price;
      return a.price - b.price;
    });
  }, [results, airline, stops, sort]);

  const resetFilters = () => { setAirline("all"); setStops("all"); setSort("price-asc"); };
  const firstPrice = results.reduce((best, current) => Math.min(best, current.price), Infinity);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <FlightHero initial={{ origin, destination, departDate, returnDate }} />

      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <section aria-label="Flight fare results" className="space-y-6">
          {!hasSearch && (
            <div className="gth-glass rounded-3xl border border-[var(--border)] p-6 md:p-8">
              <h2 className="text-xl font-bold">Find an airfare for your journey</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
                Search by airports and travel dates to view available cached fare observations. Choose the right offer on the provider's website, where current ticket availability and final payment are handled.
              </p>
            </div>
          )}
          {hasSearch && !validSearch && (
            <div role="alert" className="gth-glass rounded-3xl border border-[var(--border)] p-6">
              <h2 className="text-lg font-bold">Review your flight search</h2>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Enter two different three-letter airport codes and a valid departure date to view fares.
              </p>
            </div>
          )}
          {hasSearch && validSearch && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-soft)]">Flight fare observations</p>
                  <h2 className="mt-1 text-xl font-bold md:text-3xl">{origin} <span aria-hidden="true">→</span> {destination}</h2>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">
                    Depart {departDate}{returnDate ? ` • Return ${returnDate}` : " • One-way"}
                  </p>
                </div>
                <div className="gth-glass rounded-xl border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-soft)]">
                  <ShieldCheck size={15} className="mr-2 inline" aria-hidden="true" />
                  Prices are indicative, not live availability
                </div>
              </div>
              {loading && (
                <div role="status" aria-live="polite" className="gth-glass rounded-2xl border border-[var(--border)] p-8">
                  <p className="animate-pulse text-sm">Retrieving recent fare observations…</p>
                </div>
              )}
              {error && (
                <div role="alert" className="gth-glass rounded-2xl border border-[var(--border)] p-8">
                  <h3 className="font-semibold">Unable to load fares</h3>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{error}</p>
                  <p className="mt-2 text-xs text-[var(--text-soft)]">No fare values have been estimated or invented.</p>
                </div>
              )}
              {!loading && !error && results.length === 0 && (
                <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-8">
                  <h3 className="font-semibold">No cached fare observations for this search</h3>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">
                    This does not mean flights are sold out. Search other dates or check with an airline or partner.
                  </p>
                </div>
              )}
              {!loading && !error && results.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                      <p className="text-xs text-[var(--text-soft)]">Lowest displayed observation</p>
                      <p className="mt-2 text-2xl font-bold">{currency.format(firstPrice)}</p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">Not a guaranteed booking price</p>
                    </div>
                    <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                      <p className="text-xs text-[var(--text-soft)]">Observed options for this search</p>
                      <p className="mt-2 text-2xl font-bold">{results.length}</p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">A limited fare cache, not all airlines or seats</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
                    <aside aria-label="Filter flight observations" className="gth-glass self-start rounded-2xl border border-[var(--border)] p-5 lg:sticky lg:top-24">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-semibold"><SlidersHorizontal size={17} /> Filters</h3>
                        <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-xs underline">
                          <RotateCcw size={13} /> Reset
                        </button>
                      </div>
                      <div className="mt-5 space-y-4">
                        <div>
                          <label htmlFor="stops" className="mb-2 block text-sm font-medium">Stops</label>
                          <select id="stops" value={stops} onChange={(event) => setStops(event.target.value as Stops)}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm text-[var(--text)]">
                            <option value="all">Any number of stops</option>
                            <option value="direct">Nonstop only</option>
                            <option value="one-stop">Exactly one stop</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="airlines" className="mb-2 block text-sm font-medium">Airline</label>
                          <select id="airlines" value={airline} onChange={(event) => setAirline(event.target.value)}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm text-[var(--text)]">
                            <option value="all">All reported airlines</option>
                            {airlines.map((code) => <option key={code} value={code}>{code}</option>)}
                          </select>
                        </div>
                        <p className="text-xs leading-5 text-[var(--text-soft)]">
                          Filters only apply to the observed results returned by the fare provider.
                        </p>
                      </div>
                    </aside>
                    <div className="min-w-0">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p role="status" className="text-sm text-[var(--text-soft)]">
                          <Filter size={15} className="mr-1 inline" aria-hidden="true" />
                          {filtered.length} of {results.length} observations
                        </p>
                        <div className="flex items-center gap-2">
                          <label htmlFor="sort" className="text-sm">Sort</label>
                          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]">
                            <option value="price-asc">Lowest observed price</option>
                            <option value="price-desc">Highest observed price</option>
                            <option value="duration">Shortest reported duration</option>
                            <option value="departure">Earliest departure</option>
                          </select>
                        </div>
                      </div>
                      {filtered.length === 0 && (
                        <p role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm">
                          No observed fares match those filters. <button onClick={resetFilters} className="underline">Reset filters</button>
                        </p>
                      )}
                      <div className="space-y-4">
                        {filtered.map((fare) => (
                          <article key={fare.id} className="gth-glass rounded-2xl border border-[var(--border)] p-5 transition-shadow hover:shadow-lg md:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                  <Plane size={16} aria-hidden="true" />
                                  {fare.airlineCode ? `Airline ${fare.airlineCode}` : "Airline not reported"}
                                  {fare.flightNumber ? ` • Flight ${fare.flightNumber}` : ""}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-soft)]">Departure: {fare.departureAt.replace("T", " ").slice(0, 16)} (local time as supplied by provider)</p>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-2xl font-bold">{currency.format(fare.price)}</p>
                                <p className="mt-1 text-xs text-[var(--text-soft)]">Observed fare • recheck total on partner</p>
                              </div>
                            </div>
                            <div className="my-5 flex flex-wrap items-center gap-4 border-y border-[var(--border)] py-4 text-sm">
                              <span className="font-semibold">{fare.originAirport || fare.origin}</span>
                              <span aria-hidden="true">→</span>
                              <span className="font-semibold">{fare.destinationAirport || fare.destination}</span>
                              <span className="flex items-center gap-1 text-[var(--text-soft)]"><Clock3 size={15} /> {duration(fare.durationMinutes)}</span>
                              <span className="text-[var(--text-soft)]">
                                {fare.transfers === null ? "Stops not reported" :
                                  fare.transfers === 0 ? "Nonstop" :
                                  fare.transfers === 1 ? "1 stop" : `${fare.transfers} stops`}
                              </span>
                            </div>
                            {fare.returnAt && <p className="mb-4 text-xs text-[var(--text-soft)]">Return: {fare.returnAt.replace("T", " ").slice(0, 16)} (partner-supplied local time)</p>}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <p className="max-w-xl text-xs leading-5 text-[var(--text-soft)]">
                                Baggage, fare rules, taxes and availability must be checked with the partner.
                              </p>
                              <a href={fare.partnerUrl} target="_blank" rel="noopener noreferrer sponsored"
                                className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
                                Check on Aviasales <ArrowUpRight size={16} />
                              </a>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {checkedAt && (
                <p className="text-xs leading-6 text-[var(--text-soft)]">
                  Data request checked: {new Date(checkedAt).toLocaleString("en-IN")}. Aviasales Data API uses historic fare observations, not real-time inventory.
                  Offers may change or disappear. GTH PRO does not issue tickets on this page.
                </p>
              )}
            </>
          )}
        </section>

        <section aria-label="Continue planning" className="mt-12">
          <h2 className="text-xl font-bold md:text-2xl">Continue planning your trip</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Discover accommodation, experiences and destination guides on the same GTH PRO site.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Find hotels", url: "/hotels", icon: "Stays" },
              { title: "Explore tours", url: "/tours", icon: "Experiences" },
              { title: "Browse destinations", url: "/destinations", icon: "Places" },
              { title: "Read travel guides", url: "/guides", icon: "Guides" },
            ].map((item) => (
              <Link key={item.url} href={item.url} className="gth-glass group rounded-2xl border border-[var(--border)] p-5">
                <span className="text-xs text-[var(--text-soft)]">{item.icon}</span>
                <span className="mt-2 flex items-center justify-between gap-3 font-semibold">
                  {item.title} <Compass size={17} className="shrink-0 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <PopularDestinations destinations={flightDestinations} origin={origin || "CCU"} />
        <section className="mt-12 rounded-2xl border border-[var(--border)] p-5 text-xs leading-6 text-[var(--text-soft)]">
          <h2 className="mb-2 text-base font-semibold text-[var(--text)]">How GTH flight discovery works</h2>
          <p>
            We show a subset of previously observed Aviasales fares when the provider supplies results. We are not an airline or an issuing travel agency on this page.
            Booking, payment, confirmation, support, refunds and any partner fees are managed by your chosen ticket seller under their conditions.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div role="status" className="min-h-screen bg-[var(--bg)] p-12 text-[var(--text)]">Loading flight search…</div>}>
      <FlightsContent />
    </Suspense>
  );
}
