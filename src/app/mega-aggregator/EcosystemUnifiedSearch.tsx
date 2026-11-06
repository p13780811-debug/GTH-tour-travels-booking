"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight, BriefcaseBusiness, Building2, Globe2, Plane, Search} from "lucide-react";

/** Uses the existing /search route and its validated pillar-specific routing.
 * No duplicate provider API, invented results, client token or CSS theme.
 */
type Pillar = "all" | "travel" | "property" | "tender";
type SearchCategory = "all" | "hotel" | "flight" | "tour" | "destination" | "blog" | "property" | "tender";

const tabs = [
  {id:"all", label:"All GTH PRO", Icon:Globe2, initial:"all"},
  {id:"travel", label:"Travel", Icon:Plane, initial:"hotel"},
  {id:"property", label:"Real Estate", Icon:Building2, initial:"property"},
  {id:"tender", label:"Tenders", Icon:BriefcaseBusiness, initial:"tender"},
] as const;
const categories:Record<Pillar, readonly {value:SearchCategory;label:string}[]>={
  all:[
    {value:"all",label:"All platforms"}, {value:"hotel",label:"Hotels"},
    {value:"flight",label:"Flights"}, {value:"tour",label:"Tours & experiences"},
    {value:"destination",label:"Destinations"}, {value:"blog",label:"Guides & articles"},
    {value:"property",label:"Real Estate"}, {value:"tender",label:"Tender opportunities"},
  ],
  travel:[
    {value:"hotel",label:"Hotels"}, {value:"flight",label:"Flights"},
    {value:"tour",label:"Tours & experiences"}, {value:"destination",label:"Destinations"},
    {value:"blog",label:"Guides & articles"},
  ],
  property:[{value:"property",label:"Properties and projects"}],
  tender:[{value:"tender",label:"Tender notices"}],
};
const directLinks=[
  {label:"Hotels",href:"/hotels"}, {label:"Flights",href:"/flights"},
  {label:"Tours",href:"/tours"}, {label:"Cruises",href:"/cruises"},
  {label:"Bus · 12Go",href:"/bus"}, {label:"Train · 12Go",href:"/train"},
  {label:"Property registry",href:"/real-estate/registry"}, {label:"Tender search",href:"/tender"},
] as const;

export default function EcosystemUnifiedSearch() {
  const [pillar,setPillar]=useState<Pillar>("all");
  const [category,setCategory]=useState<SearchCategory>("all");
  const [query,setQuery]=useState("");

  function selectPillar(next:Pillar) {
    setPillar(next);
    setCategory(tabs.find(tab=>tab.id===next)!.initial);
  }

  return (
    <section id="ecosystem-search" aria-labelledby="ecosystem-search-title"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--text)] shadow-xl sm:rounded-3xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO · Universal discovery</p>
          <h2 id="ecosystem-search-title" className="mt-2 text-xl font-bold sm:text-2xl">Search one ecosystem, explore every pillar.</h2>
        </div>
        <Link href="/search" className="hidden min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 sm:inline-flex">
          Full discovery <ArrowUpRight size={15} aria-hidden="true"/>
        </Link>
      </div>

      <div role="group" aria-label="Select GTH PRO platform" className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {tabs.map(({id,label,Icon})=>(
          <button type="button" key={id} aria-pressed={pillar===id} onClick={()=>selectPillar(id)}
            className={pillar===id
              ?"gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold"
              :"gth-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold"}>
            <Icon size={16} aria-hidden="true"/> {label}
          </button>
        ))}
      </div>

      <form action="/search" method="get" role="search" aria-label="Universal ecosystem search"
        className="mt-4 grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <label htmlFor="ecosystem-universal-keyword" className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          {pillar==="property"?"Project, property or city":pillar==="tender"?"Tender keyword or sector":"What would you like to find?"}
          <input id="ecosystem-universal-keyword" type="search" name="q" autoComplete="off"
            maxLength={100} value={query} onChange={event=>setQuery(event.target.value)}
            placeholder={pillar==="property"?"Mumbai apartments, plots…":pillar==="tender"?"Construction, procurement, IT…":"Mumbai hotels, Paris tours, property, tenders…"}
            className="gth-input mt-2 block min-h-12 w-full min-w-0"/>
        </label>
        <label htmlFor="ecosystem-universal-category" className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Search category
          <select id="ecosystem-universal-category" name="category" value={category}
            onChange={event=>setCategory(event.target.value as SearchCategory)}
            className="gth-input mt-2 block min-h-12 w-full min-w-0">
            {categories[pillar].map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="submit" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:col-span-2 lg:col-span-1">
          <Search size={16} aria-hidden="true"/> Search GTH PRO
        </button>
      </form>

      <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
        Connected search opens existing GTH PRO pages. Booking dates, guest details, prices and payment remain in the verified provider workflow.
      </p>
      <nav aria-label="Open a service directly" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {directLinks.map(link=>(
          <Link key={link.href} href={link.href}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-xs font-semibold text-[var(--text)] hover:border-[var(--gold)]">
            {link.label} <ArrowUpRight size={13} aria-hidden="true"/>
          </Link>
        ))}
      </nav>
    </section>
  );
}
