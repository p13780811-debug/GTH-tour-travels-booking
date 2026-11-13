"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,CalendarDays,Search} from "lucide-react";

export type StadiumDiscoveryEvent={
  id:string; title:string; starts:string; ends?:string; venue:string; city:string;
  country:string; sport:string; venueSlug:string; officialUrl:string;
};
type Props={events:readonly StadiumDiscoveryEvent[]};
const normalize=(s:string)=>s.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase();
export default function StadiumEventDiscovery({events}:Props){
  const [query,setQuery]=useState("");
  const [sport,setSport]=useState("");
  const [country,setCountry]=useState("");
  const [from,setFrom]=useState("");
  const sports=useMemo(()=>Array.from(new Set(events.map(e=>e.sport))).sort(),[events]);
  const countries=useMemo(()=>Array.from(new Set(events.map(e=>e.country))).sort(),[events]);
  const results=useMemo(()=>events.filter(e=>{
    const text=normalize([e.title,e.venue,e.city,e.country,e.sport].join(" "));
    const terms=normalize(query.slice(0,80)).trim().split(/\s+/).filter(Boolean);
    return terms.every(t=>text.includes(t))&&(!sport||e.sport===sport)&&
      (!country||e.country===country)&&(!from||(e.ends??e.starts)>=from);
  }),[events,query,sport,country,from]);
  return <section id="stadium-event-discovery" aria-labelledby="stadium-events-search-title" className="mt-8 scroll-mt-24">
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Global event discovery</p>
      <h2 id="stadium-events-search-title" className="mt-2 text-2xl font-bold sm:text-3xl">Find a reviewed upcoming event</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Search our source-reviewed event shortlist. These are published fixture references, not live tickets, seat stock or confirmed prices.</p>
    </div>
    <div className="gth-glass grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold">Event, team or venue
        <span className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3"><Search size={17} aria-hidden="true"/><input type="search" maxLength={80} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cricket, Melbourne..." className="min-h-12 w-full min-w-0 bg-transparent text-[var(--text)]"/></span>
      </label>
      <label className="text-sm font-semibold">Event type
        <select value={sport} onChange={e=>setSport(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All sports and shows</option>{sports.map(s=><option key={s} value={s}>{s}</option>)}</select>
      </label>
      <label className="text-sm font-semibold">Country
        <select value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All countries</option>{countries.map(c=><option key={c} value={c}>{c}</option>)}</select>
      </label>
      <label className="text-sm font-semibold">On or after
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"/>
      </label>
    </div>
    <div className="my-4 flex flex-wrap items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-sm text-[var(--text-soft)]">{results.length} reviewed upcoming {results.length===1?"event":"events"}</p>
      {(query||sport||country||from)&&<button type="button" onClick={()=>{setQuery("");setSport("");setCountry("");setFrom("");}} className="gth-btn min-h-11 rounded-xl px-4 text-sm">Clear filters</button>}
    </div>
    {results.length===0?<div className="gth-glass rounded-2xl border border-[var(--border)] p-5"><p className="font-semibold">No matching reviewed events</p><p className="mt-2 text-sm text-[var(--text-soft)]">Try another filter or browse official venue calendars below. This is not a claim that no tickets exist.</p><a href="#official-stadium-sources" className="gth-btn mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Find official league and organizer sources</a></div>:
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map(e=><article key={e.id} className="gth-glass flex flex-col rounded-2xl border border-[var(--border)] p-5">
      <p className="flex items-center gap-2 text-xs font-semibold text-[var(--gold)]"><CalendarDays size={16} aria-hidden="true"/>{e.sport}</p>
      <h3 className="mt-3 text-lg font-bold">{e.title}</h3>
      <p className="mt-2 text-sm text-[var(--text-soft)]">{e.venue} · {e.city}, {e.country}</p>
      <p className="mt-2 text-sm"><time dateTime={e.starts}>{e.starts}</time>{e.ends&&<> – <time dateTime={e.ends}>{e.ends}</time>}</p>
      <div className="mt-auto flex flex-wrap gap-3 pt-5"><a href={e.officialUrl} target="_blank" rel="noopener noreferrer" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Official event source <ArrowUpRight size={16} aria-hidden="true"/></a><Link prefetch={false} href={"/stadiums/"+e.venueSlug} className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">Venue guide</Link></div>
    </article>)}</div>}
    <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Dates and venues may change. Organizers control ticket release, eligibility and prices. No on-site checkout or unverified availability is shown.</p>
  </section>;
}
