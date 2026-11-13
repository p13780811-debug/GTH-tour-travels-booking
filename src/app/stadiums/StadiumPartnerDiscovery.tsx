"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Search,ShieldCheck,Ticket} from "lucide-react";
import {matchReviewedStadiums,stadiumPartnerSearchLinks} from "@/lib/travel/stadium-partner-discovery";

const examples=["Mumbai","Kolkata","London","New York","Manchester","Barcelona","Melbourne","Singapore","Tokyo"] as const;

/** Curated, exact reviewed partner products and official venue records only.
 * No supplier search from an unverified free-text venue query.
 */
export default function StadiumPartnerDiscovery(){
 const [term,setTerm]=useState("London");
 const links=stadiumPartnerSearchLinks(term);
 const venues=matchReviewedStadiums(term);
 return <section aria-labelledby="stadium-partner-search-title" className="gth-glass mt-7 rounded-3xl border border-[var(--border)] p-5 sm:p-7">
  <header>
   <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Ticket size={17} aria-hidden="true"/> Source-checked event and venue research</p>
   <h2 id="stadium-partner-search-title" className="mt-2 text-2xl font-bold sm:text-3xl">Find official venue information and reviewed ticket experiences</h2>
   <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">
    Search the GTH PRO venue directory. Only reviewed, exact supplier products are linked as bookable experiences;
    generic keyword searches are not presented as stadium tours or match tickets. Check the organizer&apos;s calendar for current events.
   </p>
  </header>
  <div className="mt-5 max-w-3xl">
   <label htmlFor="gth-stadium-partner-query" className="block text-sm font-semibold">City, club or stadium</label>
   <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
    <Search size={18} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
    <input id="gth-stadium-partner-query" type="search" name="stadium-partner-query"
      maxLength={80} value={term} onChange={event=>setTerm(event.target.value)}
      placeholder="Eden Gardens, Kolkata, Wembley, MCG..."
      className="min-h-12 min-w-0 w-full bg-transparent text-sm text-[var(--text)] outline-offset-2"/>
   </div>
   <div className="mt-3 flex flex-wrap gap-2" aria-label="Example global destinations">
    {examples.map(city=><button key={city} type="button" onClick={()=>setTerm(city)} aria-pressed={term===city}
       className={term===city?"gth-btn-gold min-h-10 rounded-xl px-3 text-xs font-semibold":"gth-btn min-h-10 rounded-xl px-3 text-xs font-semibold"}>{city}</button>)}
   </div>
  </div>
  {venues.length>0&&<nav aria-label="Matching official venue guides" className="mt-6 grid gap-3 sm:grid-cols-2">
    {venues.map(venue=><Link key={venue.slug} href={"/stadiums/"+venue.slug}
      className="flex min-h-20 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-semibold hover:underline">
      <span>{venue.name}<span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">{venue.city}, {venue.country} · official event-source guide</span></span>
      <ArrowUpRight size={18} className="shrink-0" aria-hidden="true"/>
    </Link>)}
   </nav>}
  {links&&<div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2" aria-label="Reviewed exact venue products">
    {links.klook&&<article className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-lg font-bold">{links.klookLabel}</h3>
      <p className="my-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">{links.venueName}, {links.city}. This is a specific reviewed product, not generic search results.</p>
      <a href={links.klook} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">View verified-source product <ArrowUpRight size={17}/></a>
    </article>}
    {links.getyourguide&&<article className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-lg font-bold">{links.getyourguideLabel}</h3>
      <p className="my-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">{links.venueName}, {links.city}. Check whether admission includes a tour or a match.</p>
      <a href={links.getyourguide} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">View verified-source product <ArrowUpRight size={17}/></a>
    </article>}
   </div>}
  {!links&&<p role="status" className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--text-soft)]">
    No exact reviewed partner stadium product for this search. That does not mean no tour exists.
    Use the official venue guide or event calendar instead of unrelated supplier keyword results.
    {term.toLowerCase().includes("eden")&&<> For Eden Gardens, see the <Link href="/stadiums/eden-gardens" className="font-semibold underline">Kolkata cricket venue guide</Link> and official Cricket Association of Bengal notices.</>}
  </p>}
  <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
   <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>
   Products, dates, admission and prices are confirmed by the linked provider. No paid event API, live inventory,
   new supplier integration, cron or on-site payment is used. <Link href="/affiliate-disclosure" prefetch={false} className="font-semibold underline">Affiliate disclosure</Link>
  </p>
 </section>;
}
