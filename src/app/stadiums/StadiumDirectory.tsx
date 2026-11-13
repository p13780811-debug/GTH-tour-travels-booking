"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Ticket } from "lucide-react";
import { filterStadiums, stadiumSports, type Stadium, type StadiumSport } from "@/lib/travel/stadiums";

export default function StadiumDirectory({ venues }: { venues: readonly Stadium[] }) {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<StadiumSport | "">("");
  const results = filterStadiums(venues, query, sport);

  return <section id="stadium-directory" aria-label="Find a stadium" className="mt-8 scroll-mt-24">
    <div className="gth-glass grid gap-4 rounded-2xl border border-[var(--border)] p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">Venue, city, country or team
        <input type="search" value={query} maxLength={80} onChange={event => setQuery(event.target.value)}
          placeholder="Kolkata, Wembley, MCG, Yankees…"
          className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"/>
      </label>
      <label className="text-sm font-semibold">Sport or event type
        <select value={sport} onChange={event => setSport(event.target.value as StadiumSport | "")}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]">
          <option value="">All event types</option>
          {stadiumSports.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
    </div>
    <p role="status" aria-live="polite" className="my-5 text-sm text-[var(--text-soft)]">{results.length} venue guides</p>
    {results.length === 0 ? <div className="gth-glass rounded-2xl p-6">
      <h2 className="text-xl font-bold">Try another venue or city</h2>
      <p className="mt-2 text-[var(--text-soft)]">This collection covers selected venues. Clear your filters to explore the directory, or check official global event sources below.</p>
      <a href="#official-stadium-sources" className="gth-btn mt-4 mr-3 inline-flex min-h-12 items-center rounded-xl px-5">Browse official sources</a>
      <button onClick={() => { setQuery(""); setSport(""); }} className="gth-btn-gold mt-4 min-h-12 rounded-xl px-5">Clear filters</button>
    </div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {results.map(venue => <article key={venue.slug} className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
        <Ticket size={28} aria-hidden="true" className="text-[var(--gold)]"/>
        <h2 className="mt-4 text-xl font-bold">{venue.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={15} aria-hidden="true"/>{venue.city}, {venue.country}</p>
        <p className="mt-3 text-xs font-semibold text-[var(--gold)]">{venue.sports.join(" · ")}</p>
        <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{venue.overview}</p>
        <p className="mt-4 text-xs text-[var(--text-soft)]">{venue.products?.some(product => product.kind === "Event tickets") ? "Partner game ticket listing" : venue.products?.length ? "Partner venue experience" : "Official event sources"}</p>
        <div className="mt-auto pt-5">
          <Link prefetch={false} href={`/stadiums/${venue.slug}`} className="gth-btn-gold flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            aria-label={`Explore ${venue.name} events and visitor guide`}>Explore venue<ArrowUpRight size={16} aria-hidden="true"/></Link>
          <a href={venue.schedule.url} target="_blank" rel="noopener noreferrer"
            className="gth-btn mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            aria-label={`Open official calendar source for ${venue.name}`}>
            Official events calendar <ArrowUpRight size={15} aria-hidden="true"/>
          </a>
        </div>
      </article>)}
    </div>}
  </section>;
}
