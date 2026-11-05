"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { airports } from "@/lib/travel/nuiteeAirportDirectory";
import { airportCountryNames, airportIndex } from "@/lib/travel/nuiteeAirportIndex";

const featured = ["BOM", "CCU", "DEL", "NMI", "DXB", "SIN", "LHR", "BKK"];
const detailedGuideCodes = new Set(airports.map(airport => airport.code));

export default function TransferAirportFinder() {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en");
    if (!normalized) {
      return featured.flatMap(code => {
        const airport = airportIndex.find(item => item.code === code);
        return airport ? [airport] : [];
      });
    }
    return airportIndex.filter(item =>
      [item.name, item.city, item.code, item.countryCode, airportCountryNames[item.countryCode] ?? ""]
        .some(value => value.toLocaleLowerCase("en").includes(normalized))
    ).slice(0, 8);
  }, [query]);

  return (
    <section id="airport-pickup-lookup" aria-labelledby="airport-pickup-heading"
      className="gth-glass mb-8 scroll-mt-24 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Airport arrival & pickup research</p>
          <h2 id="airport-pickup-heading" className="mt-2 text-xl font-bold sm:text-2xl">
            Choose the correct airport first
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
            Check airport names and codes before choosing a transfer pickup. Reference airports are not a live transfer inventory.
          </p>
        </div>
        <Link href="/travel/airports" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
          Full Airport Explorer <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <label htmlFor="transfer-airport-search" className="mt-6 block max-w-2xl text-sm font-semibold">
        Search airport, city, country or IATA code
      </label>
      <div className="relative mt-2 max-w-2xl">
        <Search size={18} aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
        <input id="transfer-airport-search" type="search" autoComplete="off" maxLength={70}
          value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Mumbai, Navi Mumbai, Dubai, CCU..."
          className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-11 pr-4 text-sm text-[var(--text)]" />
      </div>
      <div aria-live="polite" className="mt-3 text-xs text-[var(--text-soft)]">
        {query.trim() ? `${matches.length} airport matches shown` : "Frequently searched airport examples"}
      </div>
      {matches.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {matches.map(airport => (
            <li key={airport.code} className="flex min-w-0 flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--gold)]">
                  <MapPin size={15} aria-hidden="true" /> {airport.code}
                </span>
                <h3 className="mt-2 text-sm font-bold leading-6">{airport.name}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
                  {airport.city}, {airportCountryNames[airport.countryCode] ?? airport.countryCode}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                {detailedGuideCodes.has(airport.code) && (
                  <Link href={`/travel/airports/${airport.code.toLowerCase()}`}
                    className="text-[var(--gold)] underline-offset-2 hover:underline">Airport guide</Link>
                )}
                <a href="#transfer-provider-heading" className="underline-offset-2 hover:underline">
                  Compare pickup options <ArrowRight size={12} className="inline" aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">No matching airport in this curated directory. Try another city or code.</p>
      )}
      <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">
        After finding your airport, enter the exact pickup and destination inside the selected supplier's booking form below.
        The reference search does not prefill a provider reservation or make a chargeable API request.
      </p>
    </section>
  );
}
