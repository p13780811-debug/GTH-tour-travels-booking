"use client";
import {useMemo,useState} from "react";
import {ArrowUpRight} from "lucide-react";
import {ticketDestinations} from "@/lib/travel/stadium-ticket-destinations";

export default function StadiumTicketDestinations(){
 const [query,setQuery]=useState("");
 const [sport,setSport]=useState("");
 const [region,setRegion]=useState("");
 const [kind,setKind]=useState("");
 const sports=useMemo(()=>Array.from(new Set(ticketDestinations.map(d=>d.sport))).sort(),[]);
 const regions=useMemo(()=>Array.from(new Set(ticketDestinations.map(d=>d.region))).sort(),[]);
 const matches=useMemo(()=>ticketDestinations.filter(d=>
  (!sport||d.sport===sport)&&(!region||d.region===region)&&(!kind||d.kind===kind)&&
  [d.name,d.sport,d.region].join(" ").toLowerCase().includes(query.trim().toLowerCase().slice(0,80))
 ),[query,sport,region,kind]);
 return <section id="global-ticket-directory" className="mt-8 scroll-mt-24" aria-labelledby="global-ticket-directory-heading">
  <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Worldwide ticket discovery</p>
  <h2 id="global-ticket-directory-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Official tickets, leagues and competition sources</h2>
  <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">Choose a genuine official ticketing destination or league calendar. An official schedule is not a ticket checkout. Listings do not represent live stock, pricing or a commercial partnership with GTH PRO.</p>
  <div className="gth-glass mt-5 grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-4">
   <label className="text-sm font-semibold">Search leagues and tickets<input type="search" maxLength={80} value={query} onChange={e=>setQuery(e.target.value)} placeholder="NBA, football, tennis..." className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"/></label>
   <label className="text-sm font-semibold">Sport<select value={sport} onChange={e=>setSport(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All sports</option>{sports.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="text-sm font-semibold">Region<select value={region} onChange={e=>setRegion(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All regions</option>{regions.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
   <label className="text-sm font-semibold">Destination type<select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All sources</option><option value="official-tickets">Official ticket portals</option><option value="official-schedule">Official fixtures</option><option value="authorized-marketplace">Ticket marketplaces</option></select></label>
  </div>
  <p role="status" className="my-4 text-sm text-[var(--text-soft)]">{matches.length} official or authorized discovery destinations</p>
  {matches.length===0?<div className="gth-glass rounded-2xl p-5"><p>No matching sources in this curated directory.</p><button type="button" onClick={()=>{setQuery("");setSport("");setRegion("");setKind("");}} className="gth-btn mt-3 min-h-11 rounded-xl px-4">Show all sources</button></div>:
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matches.map(d=><article key={d.id} className="gth-glass flex flex-col rounded-2xl border border-[var(--border)] p-5">
   <p className="text-xs font-semibold text-[var(--gold)]">{d.region} · {d.sport}</p>
   <h3 className="mt-2 text-lg font-bold">{d.name}</h3>
   <p className="mt-2 flex-1 text-xs text-[var(--text-soft)]">{d.kind==="official-tickets"?"Official ticketing destination":d.kind==="authorized-marketplace"?"Ticket marketplace — verify seller and event":"Official competition calendar — follow organizer ticket instructions"}</p>
   <a href={d.url} target="_blank" rel="noopener noreferrer" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">{d.kind==="official-tickets"?"Official ticket page":d.kind==="authorized-marketplace"?"Browse tickets":"Official fixtures"}<ArrowUpRight size={16} aria-hidden="true"/></a>
  </article>)}</div>}
  <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Always verify the exact event, approved seller, availability, final price and refund conditions on the destination website. Links may change without notice.</p>
 </section>;
}
