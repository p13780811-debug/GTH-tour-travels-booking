"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plane, Search } from "lucide-react";
import { airports } from "@/lib/travel/nuiteeAirportDirectory";
import { airportCountries, airportCountryNames, airportIndex } from "@/lib/travel/nuiteeAirportIndex";

const guideCodes = new Set(airports.map(item => item.code));
const PAGE_SIZE = 30;

export default function AirportDiscoveryTools() {
  const [origin, setOrigin] = useState("CCU");
  const [destination, setDestination] = useState("BOM");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("en");
    return airportIndex.filter(airport => {
      if (country && airport.countryCode !== country) return false;
      if (!term) return true;
      return [airport.name, airport.city, airport.code, airport.icao, airport.countryCode,
        airportCountryNames[airport.countryCode] ?? ""]
        .some(value => value.toLocaleLowerCase("en").includes(term));
    });
  }, [search, country]);

  function changeSearch(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  function changeCountry(value: string) {
    setCountry(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      <section aria-labelledby="route-planner" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 md:p-7">
          <h2 id="route-planner" className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <Plane size={22} aria-hidden="true" /> Choose your route
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            Choose airport codes, then continue to the existing flight search.
            Select dates in the provider&apos;s booking form for actual offers.
          </p>
          <form action="/flights" method="get" className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block min-w-0 text-sm font-semibold">
              From
              <select name="origin" value={origin} required onChange={event => setOrigin(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]">
                {airportIndex.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code}) · {airportCountryNames[a.countryCode] ?? a.countryCode}</option>)}
              </select>
            </label>
            <label className="block min-w-0 text-sm font-semibold">
              To
              <select name="destination" value={destination} required onChange={event => setDestination(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]">
                {airportIndex.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code}) · {airportCountryNames[a.countryCode] ?? a.countryCode}</option>)}
              </select>
            </label>
            <button type="submit" disabled={origin === destination}
              className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
              Explore route <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          {origin === destination && <p role="alert" className="mt-2 text-sm text-[var(--text-soft)]">Choose different origin and destination airports.</p>}
          <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
            An airport in this reference directory is not a guarantee of a scheduled or bookable flight.
            Live availability and final fares come from the existing flight provider.
          </p>
        </div>
      </section>

      <section aria-labelledby="airport-directory" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="airport-directory" className="text-2xl font-bold md:text-3xl">Browse the airport directory</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              {airportIndex.length} unique airport references from read-only Nuitee metadata lookups.
              Search by city, airport name, country, IATA or ICAO code.
            </p>
          </div>
          <p aria-live="polite" className="text-sm text-[var(--text-soft)]">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="block text-sm font-semibold">
            <span className="inline-flex items-center gap-2"><Search size={16} aria-hidden="true" /> Airport or city</span>
            <input type="search" autoComplete="off" maxLength={70} value={search} onChange={event => changeSearch(event.target.value)}
              placeholder="Example: Mumbai, Dubai, LHR, Singapore"
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)] placeholder:text-[var(--text-soft)]" />
          </label>
          <label className="block text-sm font-semibold">
            Country
            <select value={country} onChange={event => changeCountry(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]">
              <option value="">All countries</option>
              {airportCountries.map(code => <option value={code} key={code}>{airportCountryNames[code] ?? code}</option>)}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-sm">No airport matched this search. Try a city or IATA code.</p>
            <button type="button" className="mt-3 text-sm font-semibold underline"
              onClick={() => { changeSearch(""); changeCountry(""); }}>Clear filters</button>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visibleCount).map(a => (
                <li key={a.code} className="gth-glass flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--border)] p-5">
                  <div>
                    <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-bold">{a.code}</span>
                    <h3 className="mt-3 text-base font-bold leading-6">{a.name}</h3>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">{a.city}, {airportCountryNames[a.countryCode] ?? a.countryCode}</p>
                    {a.icao && <p className="mt-2 text-xs text-[var(--text-soft)]">ICAO: {a.icao}</p>}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                    {guideCodes.has(a.code) && (
                      <Link className="gold-text underline" href={`/travel/airports/${a.code.toLowerCase()}`}>Airport guide</Link>
                    )}
                    <Link className="underline" href={`/flights?origin=CCU&destination=${a.code}`}>
                      Explore flights <ArrowRight className="inline" size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {filtered.length > visibleCount && (
              <button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                className="gth-glass mx-auto mt-7 flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold">
                Show more airports
              </button>
            )}
          </>
        )}
        <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">
          Reference snapshot: 5 November 2026. Airport metadata may change. Some reference records may
          not currently have scheduled passenger service. Always verify with your airline and airport.
          No paid API calls are made when using this directory.
        </p>
      </section>
    </>
  );
}
