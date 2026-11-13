"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Search,ShieldCheck,Ticket} from "lucide-react";
import {reviewedStadiumMatches} from "@/lib/travel/stadium-partner-discovery";

const examples=["Kolkata","Mumbai","London","Melbourne","New York","Manchester","Barcelona","Singapore","Tokyo"] as const;

/** Review-first directory; never turn raw search into third-party GYG/Klook
 * query. "Eden Gardens" was misresolved as Eden in Australia by a supplier.
 * Exact supplier links exist only on the reviewed venue page.
 */
export default function StadiumPartnerDiscovery(){
 const [term,setTerm]=useState("London");
 const matches=reviewedStadiumMatches(term);
 return <section aria-labelledby="stadium-partner-search-title" className="gth-glass mt-7 rounded-3xl border border-[var(--border)] p-5 sm:p-7">
  <header>
   <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Ticket size={17} aria-hidden="true"/> Verified venue and ticket research</p>
   <h2 id="stadium-partner-search-title" className="mt-2 text-2xl font-bold sm:text-3xl">Find the right stadium before selecting a supplier</h2>
   <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">
     First verify the stadium, city and official ticket information. We show a reviewed external experience link only when an exact venue product is recorded in our catalog.
     This is not a live feed of every upcoming match. Generic supplier search can return unrelated towns or activities.
   </p>
  </header>
  <div className="mt-5 max-w-3xl">
   <label htmlFor="gth-stadium-partner-query" className="block text-sm font-semibold">Stadium, club or city</label>
   <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
    <Search size={18} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
    <input id="gth-stadium-partner-query" type="search" maxLength={80}
      value={term} onChange={event=>setTerm(event.target.value)}
      placeholder="Eden Gardens, Kolkata, Wembley..."
      className="min-h-12 min-w-0 w-full bg-transparent text-sm text-[var(--text)] outline-offset-2"/>
   </div>
   <div className="mt-3 flex flex-wrap gap-2" aria-label="Example global destinations">
    {examples.map(city=><button key={city} type="button" onClick={()=>setTerm(city)} aria-pressed={term===city}
     className={term===city?"gth-btn-gold min-h-10 rounded-xl px-3 text-xs font-semibold":"gth-btn min-h-10 rounded-xl px-3 text-xs font-semibold"}>{city}</button>)}
   </div>
  </div>
  {matches.length===0?<div role="status" className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
   <p className="text-sm font-semibold">No matching source-reviewed stadium in this directory.</p>
   <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">This does not mean events or tickets are unavailable. Browse the wider official ticket-source directory instead of opening an unrelated supplier search.</p>
   <Link href="/tickets" className="gth-btn mt-3 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Worldwide ticket sources</Link>
  </div>:<div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
   {matches.map(venue=><article key={venue.slug} className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
    <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">{venue.city}, {venue.country}</p>
    <h3 className="mt-2 text-lg font-bold">{venue.name}</h3>
    <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">
      {venue.reviewedProducts>0?venue.reviewedProducts+" reviewed venue-related partner product(s) are linked from the venue guide. Confirm the selected product includes the right access.":
       "No independently reviewed supplier tour/product currently linked for this venue. Check its official event or ticket notices."}
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
     <Link href={"/stadiums/"+venue.slug} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Venue guide <ArrowUpRight size={15}/></Link>
     <a href={venue.officialUrl} target="_blank" rel="noopener noreferrer" className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
      Official source <ArrowUpRight size={15}/>
     </a>
    </div>
   </article>)}
  </div>}
  <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
   <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>
   Venue guides distinguish match admission, guided tours and organizer schedules. No paid event API, false supplier availability or on-site ticket transaction is used.
   <Link href="/affiliate-disclosure" className="font-semibold underline">Affiliate disclosure</Link>
  </p>
 </section>;
}
