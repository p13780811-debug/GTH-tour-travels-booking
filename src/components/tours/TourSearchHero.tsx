"use client";

import type {FormEvent} from "react";
import Image from "next/image";
import Link from "next/link";
import {ArrowRight,Compass,Search} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {partnerSearchHref} from "@/lib/travel/partner-search";
import {TOUR_CATEGORIES,parseTourFilters,EMPTY_TOUR_SEARCH,EXPERIENCE_MODES,experienceCategories,type ExperiencePath,type TourSearch} from "@/lib/tours/discovery";

/** Pre-rendered search progressively enhances the native GET form on the client. */
export default function TourSearchHero({basePath,filters=EMPTY_TOUR_SEARCH}:{basePath:ExperiencePath;filters?:TourSearch}){
 const mode=EXPERIENCE_MODES[basePath],categories=experienceCategories(basePath);
 function handleSearch(event:FormEvent<HTMLFormElement>){
  const parsed=parseTourFilters(Object.fromEntries(new FormData(event.currentTarget).entries()));
  if(!parsed.ok)return;
  const category=TOUR_CATEGORIES.find(item=>item.value===parsed.filters.category)?.label || "";
  const providerUrl=partnerSearchHref(basePath==="/tours"?"tours":"activities",parsed.filters.city,category);
  // User-initiated Klook tab + native GET navigation to filtered #discover cards.
  // Do not preventDefault: local search still works when a popup is blocked.
  if(providerUrl)window.open(providerUrl,"_blank","noopener,noreferrer");
 }
 return <>
  <section data-travel-hero="true" className="border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text)]">
   <div className="mx-auto max-w-7xl px-4 pb-4 pt-3 sm:px-6 sm:py-8">
    <div className="flex items-start justify-between gap-6">
     <div className="min-w-0">
      <p className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)] sm:flex"><Compass size={14} aria-hidden="true"/>GTH PRO · Global {mode.label}</p>
      <h1 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:mt-3 sm:text-3xl">{mode.title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-soft)]">{mode.description}</p>
     </div>
     <div className="hidden shrink-0 gap-2 lg:flex" aria-hidden="true">
      {[{city:"Dubai",image:"/images/cities/dubai.jpg"},{city:"London",image:"/images/cities/london.jpg"},{city:"Tokyo",image:"/images/cities/tokyo.jpg"}].map(item=><div key={item.city} className="relative h-24 w-20 overflow-hidden rounded-2xl border border-[var(--border)]"><Image src={item.image} alt="" fill sizes="80px" className="object-cover"/></div>)}
     </div>
    </div>
    <div role="navigation" aria-label="Choose tours or activities" className="mt-4 grid max-w-md grid-cols-2 gap-2">
     {(["/tours","/activities"] as const).map(path=><Link key={path} href={path+(filters.city?"?city="+encodeURIComponent(filters.city):"")} aria-current={path===basePath?"page":undefined} className={(path===basePath?"gth-btn-gold":"border border-[var(--border)] bg-[var(--card)] text-[var(--text)]")+" inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold"}>{EXPERIENCE_MODES[path].label}</Link>)}
    </div>
    <section aria-labelledby="experience-search-title" className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
     <h2 id="experience-search-title" className="text-sm font-bold">{basePath==="/tours"?"Find your next tour":"Find something to do"}</h2>
     <form key={JSON.stringify(filters)} action={basePath+"#discover"} method="GET" onSubmit={handleSearch} role="search" aria-label={mode.label+" destination search"} className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] sm:items-end">
      <label className="block min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium">Where are you going?
       <span className="flex items-center gap-2"><Search size={16} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/><input name="city" type="search" maxLength={80} defaultValue={filters.city} placeholder="City or destination worldwide" className="min-h-9 w-full min-w-0 bg-transparent text-sm text-[var(--text)] outline-offset-2"/></span>
      </label>
      <label className="block min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium">{basePath==="/tours"?"Tour type":"Activity type"}
       <select name="category" defaultValue={filters.category} className="min-h-9 w-full min-w-0 bg-transparent text-sm text-[var(--text)]"><option value="">{basePath==="/tours"?"All tour types":"All activity types"}</option>{categories.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}{filters.category&&!categories.some(item=>item.value===filters.category)&&<option value={filters.category}>{filters.category.replaceAll("-"," ")}</option>}</select>
      </label>
      {(["currency","minPrice","maxPrice"] as const).map(key=>filters[key]?<input key={key} type="hidden" name={key} value={filters[key]}/>:null)}
      <input type="hidden" name="sort" value={filters.sort}/>
      <button type="submit" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold">{mode.action}<ArrowRight size={16} aria-hidden="true"/></button>
     </form>
     <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-[var(--text-soft)]">
      <p>Search opens Klook in a new tab through our affiliate link and filters the original supplier cards below. Confirm dates, guests and final prices with the provider.</p>
     </div>
    </section>
   </div>
  </section>
  <TravelSectionNav/>
 </>;
}
