"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight, Search, ShieldCheck, Ticket} from "lucide-react";
import {stadiumPartnerSearchLinks} from "@/lib/travel/stadium-partner-discovery";

const examples=[
  "Mumbai", "Kolkata", "London", "New York", "Manchester",
  "Barcelona", "Melbourne", "Singapore", "Tokyo",
] as const;

/**
 * Client-side text -> pre-existing tracked partner search. Never fetches an API.
 * Results and booking terms are always displayed by the partner, not fabricated.
 */
export default function StadiumPartnerDiscovery(){
  const [term,setTerm]=useState("London");
  const links=stadiumPartnerSearchLinks(term);
  return <section aria-labelledby="stadium-partner-search-title" className="gth-glass mt-7 rounded-3xl border border-[var(--border)] p-5 sm:p-7">
    <header>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
        <Ticket size={17} aria-hidden="true"/> Existing GTH PRO affiliate programs
      </p>
      <h2 id="stadium-partner-search-title" className="mt-2 text-2xl font-bold sm:text-3xl">
        Find club, stadium and sports-ticket experiences worldwide
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">
        Search participating ticket and venue-experience suppliers through GTH PRO&apos;s
        existing Travelpayouts Klook connection and GetYourGuide partner ID.
        These searches are not a live feed of every upcoming match. The partner must
        confirm the exact event, admission type, date, availability, price and checkout.
      </p>
    </header>
    <div className="mt-5 max-w-3xl">
      <label htmlFor="gth-stadium-partner-query" className="block text-sm font-semibold">
        Club, team, city or stadium
      </label>
      <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
        <Search size={18} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
        <input id="gth-stadium-partner-query" type="search" name="stadium-partner-query"
          maxLength={80} value={term} onChange={event=>setTerm(event.target.value)}
          placeholder="Manchester United, Mumbai, Wembley..."
          className="min-h-12 min-w-0 w-full bg-transparent text-sm text-[var(--text)] outline-offset-2"/>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Example global destinations">
        {examples.map(city=><button key={city} type="button" onClick={()=>setTerm(city)}
          aria-pressed={term===city}
          className={term===city
            ?"gth-btn-gold min-h-10 rounded-xl px-3 text-xs font-semibold"
            :"gth-btn min-h-10 rounded-xl px-3 text-xs font-semibold"}>{city}</button>)}
      </div>
      {!links&&<p role="status" className="mt-3 text-sm text-[var(--text-soft)]">
        Enter a valid city, club or stadium name (2–80 letters/numbers) to search a provider.
      </p>}
    </div>
    {links&&<div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
      <article className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-lg font-bold">Sports & event-ticket search</h3>
        <p className="my-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">
          Look for {links.term} sports or event listings on Klook.
          Results may include experiences rather than a game admission ticket.
        </p>
        <a href={links.klook} target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-semibold">
          Search partner ticket options <ArrowUpRight size={17} aria-hidden="true"/>
        </a>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Klook · existing Travelpayouts tracking</p>
      </article>
      <article className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-lg font-bold">Club & stadium tours</h3>
        <p className="my-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">
          Explore {links.term} stadium or club tours. A tour or museum ticket
          does not include match admission unless the provider explicitly says so.
        </p>
        <a href={links.getyourguide} target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-semibold">
          Search venue experiences <ArrowUpRight size={17} aria-hidden="true"/>
        </a>
        <p className="mt-2 text-xs text-[var(--text-soft)]">GetYourGuide · existing GTH PRO partner ID</p>
      </article>
    </div>}
    <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
      <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>
      No paid event API, new supplier integration, ticket inventory, or on-site payment is used.
      Sport event calendars, tickets and seat availability remain with organizers and participating suppliers.
      <Link href="/affiliate-disclosure" prefetch={false} className="font-semibold underline">Affiliate disclosure</Link>
    </p>
  </section>;
}
