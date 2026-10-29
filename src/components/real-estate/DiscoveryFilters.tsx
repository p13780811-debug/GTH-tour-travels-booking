"use client"
import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import styles from "./Listing.module.css"

const initial = { country:"", city:"", type:"", listing:"buy", bedrooms:"", currency:"", minPrice:"", maxPrice:"", sort:"latest", possession:"", region:"", minArea:"", maxArea:"", areaBasis:"", minBathrooms:"", sellerRole:"", publishedWithin:"", verifiedOnly:"", withTour:"" }
/** Marketplace filters use the same unit types accepted by seller submissions. */
const LISTING_CATEGORIES = [
 ["Apartment","Apartment"],["Villa","Villa"],["Penthouse","Penthouse"],
 ["Commercial","Commercial"],["Plot","Individual plot"]
] as const

export default function DiscoveryFilters({ onApply, expanded = false }: { onApply: () => void; expanded?: boolean }) {
 const [filters, setFilters] = useState<Record<string,string>>(initial)

 useEffect(() => {
  const sync = () => {
   const params = new URLSearchParams(window.location.search)
   setFilters(Object.fromEntries(Object.keys(initial).map(key => [key, params.get(key) || (key === "sort" ? "latest" : key === "listing" ? "buy" : "")])))
  }
  sync()
  window.addEventListener("gth-discovery-filters", sync)
  window.addEventListener("popstate", sync)
  return () => { window.removeEventListener("gth-discovery-filters", sync); window.removeEventListener("popstate", sync) }
 }, [])

 const chooseCategory = (value: string) => {
  const nextType = filters.type === value ? "" : value
  setFilters(previous => ({ ...previous, type: nextType }))
  const url = new URL(window.location.href)
  if (nextType) url.searchParams.set("type", nextType)
  else url.searchParams.delete("type")
  url.searchParams.delete("page")
  window.history.replaceState(null, "", url)
  window.dispatchEvent(new Event("gth-discovery-filters"))
  onApply()
 }

 return <details id="discovery-filters" open={expanded || undefined} className={`gth-glass ${styles.filterPanel}`}>
  <summary>Refine your search <span className="text-sm font-normal opacity-70">· Location, type, bedrooms & budget</span></summary>
  <form className={styles.filterForm} onSubmit={event => {
   event.preventDefault()
   const url = new URL(window.location.href)
   for (const [key,value] of Object.entries(filters)) {
    if (value && !(key === "sort" && value === "latest")) url.searchParams.set(key,value)
    else url.searchParams.delete(key)
   }
   url.searchParams.delete("page")
   window.history.replaceState(null,"",url)
   window.dispatchEvent(new Event("gth-discovery-filters"))
   onApply()
  }}>
   {[{ key:"country", label:"Country" },{ key:"city", label:"City" }].map(field => <label key={field.key}>{field.label}<input maxLength={80} value={filters[field.key]} onChange={e => setFilters({...filters,[field.key]:e.target.value})} /></label>)}
   <fieldset className="col-span-full min-w-0 rounded-xl border border-[var(--border)] p-3">
    <legend className="px-1 text-sm font-semibold text-[var(--text)]">Property categories</legend>
    <div className="grid grid-cols-1 gap-2" role="group" aria-label="Property categories">
     <button type="button" aria-pressed={!filters.type} onClick={() => chooseCategory("")}
       className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-xs leading-5 text-[var(--text)] shadow-none aria-pressed:border-[var(--gold)] aria-pressed:bg-[var(--bg-soft)] aria-pressed:font-semibold">All property categories{!filters.type && <Check size={14} className="shrink-0" aria-hidden="true" />}</button>
     {LISTING_CATEGORIES.map(([value,label]) =>
      <button key={value} type="button" aria-pressed={filters.type===value} onClick={() => chooseCategory(value)}
       className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-xs leading-5 text-[var(--text)] shadow-none aria-pressed:border-[var(--gold)] aria-pressed:bg-[var(--bg-soft)] aria-pressed:font-semibold">{label}{filters.type===value && <Check size={14} className="shrink-0" aria-hidden="true" />}</button>
     )}
    </div>
    <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Only matching published listing types appear here. Research registered project categories through Registry lookup.</p>
   </fieldset>
   {[{ key:"listing",label:"Listing purpose",options:[["buy","For sale"],["rent","For rent"],["new_launch","New launches"],["commercial","Commercial"],["plots","Plots"]] },{ key:"bedrooms",label:"Bedrooms",options:["1","2","3","4+"].map(v=>[v,`${v} BHK`]) },{ key:"possession",label:"Possession status",options:[["ready_to_move","Ready to move"],["under_construction","Under construction"],["off_plan","Off plan"]] },{ key:"currency",label:"Currency",options:[["INR","INR · Indian rupee"],["AED","AED · UAE dirham"],["USD","USD · US dollar"],["GBP","GBP · Pound sterling"],["EUR","EUR · Euro"],["SGD","SGD · Singapore dollar"]] },{ key:"sort",label:"Sort",options:[["latest","Latest"],["ai","Smart rank"],["price_low","Price: low to high"],["price_high","Price: high to low"]] }].map(field => <label key={field.key}>{field.label}<select value={filters[field.key]} required={field.key === "currency" && Boolean(filters.minPrice || filters.maxPrice)} onChange={e => setFilters({...filters,[field.key]:e.target.value})}>{field.key !== "listing" && <option value="">Any</option>}{field.options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}
   <label>Minimum price<input name="minPrice" type="number" min="1" step="1" inputMode="numeric" value={filters.minPrice} onChange={e => setFilters({...filters,minPrice:e.target.value})} placeholder="5000000" /></label>
   <label>Maximum price<input name="maxPrice" type="number" min="1" step="1" inputMode="numeric" value={filters.maxPrice} onChange={e => setFilters({...filters,maxPrice:e.target.value})} placeholder="20000000" /></label>
   <details className="col-span-full min-w-0 rounded-xl border p-3" open={Boolean(["minArea","maxArea","areaBasis","minBathrooms","sellerRole","publishedWithin","verifiedOnly","withTour"].some(key=>filters[key]))||undefined}><summary>More recorded listing details</summary><fieldset className="mt-3 min-w-0"><legend className="sr-only">Recorded listing details</legend><div className="grid gap-3">
    <label>Minimum bathrooms<select value={filters.minBathrooms} onChange={e=>setFilters({...filters,minBathrooms:e.target.value})}><option value="">Any</option>{[1,2,3,4].map(n=><option key={n} value={n}>{n}+ bathrooms</option>)}</select></label>
    <label>Area basis<select value={filters.areaBasis} required={Boolean(filters.minArea||filters.maxArea)} onChange={e=>setFilters({...filters,areaBasis:e.target.value})}><option value="">Any recorded basis</option><option value="carpet">Carpet</option><option value="built_up">Built-up</option><option value="plot">Plot</option></select></label>
    <label>Minimum area · ft²<input type="number" min="1" max="1000000" value={filters.minArea} onChange={e=>setFilters({...filters,minArea:e.target.value})}/></label>
    <label>Maximum area · ft²<input type="number" min="1" max="1000000" value={filters.maxArea} onChange={e=>setFilters({...filters,maxArea:e.target.value})}/></label>
    <label>Submitted by<select value={filters.sellerRole} onChange={e=>setFilters({...filters,sellerRole:e.target.value})}><option value="">Any stated role</option><option value="owner">Owner</option><option value="developer">Developer / promoter</option><option value="agent">Channel partner / agent</option><option value="other">Other authorized submitter</option></select></label>
    <label>Published within<select value={filters.publishedWithin} onChange={e=>setFilters({...filters,publishedWithin:e.target.value})}><option value="">Any date</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
    <label>Unit verification<select value={filters.verifiedOnly} onChange={e=>setFilters({...filters,verifiedOnly:e.target.value})}><option value="">Any review status</option><option value="1">Only units marked GTH Verified</option></select></label>
    <label>Reviewed project media<select value={filters.withTour} onChange={e=>setFilters({...filters,withTour:e.target.value})}><option value="">Any reviewed media</option><option value="1">Project has a reviewed virtual-tour link</option></select></label>
   </div><p className="mt-3 text-xs leading-6 opacity-70">Filters match recorded fields on the same published unit. Area limits require a measurement basis; no carpet/built-up conversion is assumed. A stated seller role is separate from license or ownership verification.</p></fieldset></details>
   <div className={styles.actions}>
    <button className="gth-btn gth-btn-gold">Apply filters</button>
    <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)]" onClick={() => { const url = new URL(window.location.href); for (const key of [...Object.keys(initial), "query", "page"]) url.searchParams.delete(key); window.history.replaceState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); onApply() }}>Reset filters</button>
   </div>
   <p className="text-sm opacity-70 col-span-full">Budget filters compare only published inventory in the selected currency; GTH PRO does not apply hidden FX conversion. A currency is required whenever a budget is entered. Registry-only projects without matching inventory are not presented as priced listings.</p>
  </form>
 </details>
}
