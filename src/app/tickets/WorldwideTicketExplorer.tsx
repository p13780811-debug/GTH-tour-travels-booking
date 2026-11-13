"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Globe2,Search,Ticket} from "lucide-react";
import {ticketCategories,worldwideTicketSources,type TicketCategory} from "@/lib/travel/worldwide-ticket-sources";
import {ticketDestinations} from "@/lib/travel/stadium-ticket-destinations";
import {stadiums} from "@/lib/travel/stadiums";

type DiscoveryItem={
 id:string;name:string;region:string;categories:readonly TicketCategory[];
 href:string;kind:"ticket-platform"|"official-box-office"|"official-calendar"|"discovery-platform"|"venue-guide";
 keywords:string;
};
const items:readonly DiscoveryItem[]=[
 ...worldwideTicketSources.map(source=>({...source,href:source.url})),
 ...ticketDestinations.map(source=>({
   id:"sport-"+source.id,name:source.name,region:source.region,
   categories:["sports" as const],href:source.url,
   kind:source.kind==="official-tickets"?"official-box-office" as const:
     source.kind==="official-schedule"?"official-calendar" as const:"ticket-platform" as const,
   keywords:source.sport+" "+source.name+" "+source.region,
 })),
 ...stadiums.map(venue=>({
   id:"venue-"+venue.slug,name:venue.name+" — venue & ticket guide",region:venue.country,
   categories:(venue.sports.includes("Concerts")?["sports","concerts"]:["sports"]) as TicketCategory[],
   href:"/stadiums/"+venue.slug,kind:"venue-guide" as const,
   keywords:[venue.city,venue.country,venue.aliases,...venue.sports].filter(Boolean).join(" "),
 })),
];
const normalize=(value:string)=>value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase();
const kinds:Record<DiscoveryItem["kind"],{label:string,action:string}>={
 "ticket-platform":{label:"Ticket platform · check the event",action:"Browse ticket listings"},
 "official-box-office":{label:"Official ticket page · check availability",action:"Open official ticket page"},
 "official-calendar":{label:"Official information or event calendar",action:"Check ticket instructions"},
 "discovery-platform":{label:"Independent discovery service · verify seller",action:"Explore options"},
 "venue-guide":{label:"GTH PRO venue guide · on-site",action:"Explore venue guide"},
};
const regionMatches=(source:string,selected:string)=>
 !selected||source==="Worldwide"||source==="Multiple markets"||source===selected||
 (selected==="United States"&&source.includes("USA"))||
 (selected==="Canada"&&source.includes("Canada"))||
 (selected==="United Kingdom"&&source==="Europe");
export default function WorldwideTicketExplorer({initialCategory="",initialQuery=""}:{initialCategory?:TicketCategory|"";initialQuery?:string}){
 const [query,setQuery]=useState(initialQuery.slice(0,100));
 const [category,setCategory]=useState<TicketCategory|"">(initialCategory);
 const [region,setRegion]=useState("");
 const [showAll,setShowAll]=useState(false);
 const regions=useMemo(()=>Array.from(new Set(items.map(item=>item.region).filter(r=>r!=="Worldwide"&&r!=="Multiple markets"))).sort(),[]);
 // Exact-token matching prevents "Eden" from matching "Sweden" or suppliers
 // elsewhere. If a venue/event is not indexed we never display random tours
 // or ticket merchants as if they were exact matches.
 const {display,mode,total}=useMemo(()=>{
   const relevant=items.filter(item=>
     (!category||item.categories.includes(category))&&regionMatches(item.region,region)
   );
   const intentWords=new Set(["find","search","buy","book","official","tickets","ticket","stadium","stadiums","venue","venues","event","events","tour","tours","for","in","near","at"]);
   const terms=normalize(query.slice(0,100)).split(/[^\p{L}\p{N}]+/u).filter(term=>term.length>1&&!intentWords.has(term));
   const selected=terms.length?relevant.filter(item=>{
     const tokens=new Set(normalize([item.name,item.region,item.keywords,...item.categories].join(" "))
       .split(/[^\p{L}\p{N}]+/u).filter(Boolean));
     return terms.every(term=>tokens.has(term));
   }):relevant;
   selected.sort((a,b)=>
     Number(b.kind==="venue-guide")-Number(a.kind==="venue-guide")||
     a.name.localeCompare(b.name));
   return {
     display:selected,
     mode:terms.length===0?"browse":selected.length?"matching":"not-found",
     total:items.length
   };
 },[query,category,region]);
 const shown=showAll?display:display.slice(0,18);
 const reset=()=>{setQuery("");setCategory(initialCategory);setRegion("");setShowAll(false);};
 return <section aria-labelledby="worldwide-ticket-search-title" className="mt-6">
   <div className="gth-glass rounded-3xl border border-[var(--border)] p-5 sm:p-7">
     <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Globe2 size={17} aria-hidden="true"/> GTH PRO worldwide ticket discovery</p>
     <h2 id="worldwide-ticket-search-title" className="mt-3 text-2xl font-bold sm:text-3xl">Find where to look for your next ticket</h2>
     <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">
       Search our curated official ticket offices, event platforms, organizer calendars and venue guides.
       We keep useful non-affiliate links too. This is a source directory, not a live inventory of every event, seat or price.
     </p>
     <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       <label className="text-sm font-semibold">Event, artist, team, city or venue
         <span className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3"><Search size={17} aria-hidden="true"/><input type="search" maxLength={100} value={query} onChange={event=>{setQuery(event.target.value);setShowAll(false);}} placeholder="Cricket Mumbai, concerts London..." className="min-h-12 w-full min-w-0 bg-transparent text-[var(--text)]"/></span>
       </label>
       <label className="text-sm font-semibold">Ticket category
         <select className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]" value={category} onChange={event=>{setCategory(event.target.value as TicketCategory|"");setShowAll(false);}}>
           <option value="">All ticket categories</option>{ticketCategories.map(item=><option value={item.slug} key={item.slug}>{item.label}</option>)}
         </select>
       </label>
       <label className="text-sm font-semibold">Country or region
         <select className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]" value={region} onChange={event=>{setRegion(event.target.value);setShowAll(false);}}>
           <option value="">Any country</option>{regions.map(item=><option value={item} key={item}>{item}</option>)}
         </select>
       </label>
     </div>
     <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
       <p role="status" aria-live="polite" className="text-sm text-[var(--text-soft)]">
         {mode==="matching"?`${display.length} relevant source ${display.length===1?"match":"matches"}`:
          mode==="suggestions"?"Suggested sources; the exact event is not verified in our index.":
          mode==="not-found"?"No matching reviewed venue or ticket source. Unrelated results are hidden.":
          `${display.length} sources from ${total} indexed guides and destinations`}
       </p>
       {(query||region||category!==initialCategory)&&<button type="button" onClick={reset} className="gth-btn min-h-11 rounded-xl px-4 text-sm font-semibold">Clear search</button>}
     </div>
   </div>
   {mode==="not-found"&&<p role="status" className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-6 text-[var(--text-soft)]">
     No verified matching venue or ticket-source listing was found for these terms and filters. <Link href="/stadiums" className="font-semibold underline">Browse official stadium guides</Link>, or change the search. Generic destination tours are not venue or match tickets.
   </p>}
   <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {shown.map(item=><article key={item.id} className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
       <p className="text-xs font-semibold text-[var(--gold)]">{item.region} · {item.categories.map(c=>ticketCategories.find(t=>t.slug===c)?.label).join(" / ")}</p>
       <h3 className="mt-2 text-lg font-bold">{item.name}</h3>
       <p className="mt-2 flex-1 text-xs leading-5 text-[var(--text-soft)]">{kinds[item.kind].label}</p>
       {item.kind==="venue-guide"?
         <Link href={item.href} prefetch={false} className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">{kinds[item.kind].action}<Ticket size={16} aria-hidden="true"/></Link>:
         <a href={item.href} target="_blank" rel="noopener noreferrer" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">{kinds[item.kind].action}<ArrowUpRight size={16} aria-hidden="true"/></a>}
     </article>)}
   </div>
   {!showAll&&display.length>shown.length&&<div className="mt-5 text-center"><button type="button" onClick={()=>setShowAll(true)} className="gth-btn min-h-12 rounded-xl px-5 font-semibold">Show all {display.length} sources</button></div>}
   {mode!=="matching"&&query&&<p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">If you searched for a specific artist or match, open a suitable source and search that event there. We cannot verify that a particular event is on sale without a licensed listing feed.</p>}
   <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">
     Organizer and seller sites control tickets, delivery, refunds, dates and fees. A schedule or tour is not a match ticket.
     Always check the exact event and seller before payment. No new API, database request, or automatic supplier redirect is used.
   </p>
 </section>;
}
