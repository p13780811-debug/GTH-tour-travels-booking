"use client"
import { Check } from "lucide-react"
import { useEffect, useState } from "react"
import styles from "./Listing.module.css"

const initial = { country:"", city:"", type:"", listing:"", bedrooms:"", currency:"", minPrice:"", maxPrice:"", sort:"latest" }
/** Source-backed registry categories first; unit-level categories remain available for owner listings. */
const PROJECT_CATEGORIES = [
 ["Residential","Residential"],["Residential / Group Housing","Residential / Group Housing"],
 ["Commercial","Commercial"],["Plotted","Plotted development"],
 ["Mixed","Mixed-use development"],["Others","Other registered projects"]
] as const
const LISTING_CATEGORIES = [
 ["Apartment","Apartment"],["Villa","Villa"],["Penthouse","Penthouse"],
 ["Plot","Individual plot"]
] as const

export default function DiscoveryFilters({ onApply, expanded = false }: { onApply: () => void; expanded?: boolean }) {
 const [filters, setFilters] = useState<Record<string,string>>(initial)

 useEffect(() => {
  const sync = () => {
   const params = new URLSearchParams(window.location.search)
   setFilters(Object.fromEntries(Object.keys(initial).map(key => [key, params.get(key) || (key === "sort" ? "latest" : "")])))
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
       className="gth-btn inline-flex w-full items-center justify-between gap-2 whitespace-normal text-left">All property categories{!filters.type && <Check size={14} className="shrink-0" aria-hidden="true" />}</button>
     {[...PROJECT_CATEGORIES,...LISTING_CATEGORIES].map(([value,label]) =>
      <button key={value} type="button" aria-pressed={filters.type===value} onClick={() => chooseCategory(value)}
       className="gth-btn inline-flex w-full items-center justify-between gap-2 whitespace-normal text-left">{label}{filters.type===value && <Check size={14} className="shrink-0" aria-hidden="true" />}</button>
     )}
    </div>
    <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Only matching recorded project types and published listing types appear in results.</p>
   </fieldset>
   {[{ key:"listing",label:"Listing purpose",options:[["buy","For sale"],["rent","For rent"]] },{ key:"bedrooms",label:"Bedrooms",options:["1","2","3","4","5"].map(v=>[v,v]) },{ key:"currency",label:"Currency",options:[["INR","INR · Indian rupee"],["AED","AED · UAE dirham"],["USD","USD · US dollar"],["GBP","GBP · Pound sterling"],["EUR","EUR · Euro"],["SGD","SGD · Singapore dollar"]] },{ key:"sort",label:"Sort",options:[["latest","Latest"],["ai","Smart rank"],["price_low","Price: low to high"],["price_high","Price: high to low"]] }].map(field => <label key={field.key}>{field.label}<select value={filters[field.key]} required={field.key === "currency" && Boolean(filters.minPrice || filters.maxPrice)} onChange={e => setFilters({...filters,[field.key]:e.target.value})}><option value="">Any</option>{field.options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}
   <label>Minimum price<input name="minPrice" type="number" min="1" step="1" inputMode="numeric" value={filters.minPrice} onChange={e => setFilters({...filters,minPrice:e.target.value})} placeholder="5000000" /></label>
   <label>Maximum price<input name="maxPrice" type="number" min="1" step="1" inputMode="numeric" value={filters.maxPrice} onChange={e => setFilters({...filters,maxPrice:e.target.value})} placeholder="20000000" /></label>
   <div className={styles.actions}>
    <button className="gth-btn gth-btn-gold">Apply filters</button>
    <button type="button" className="gth-btn" onClick={() => { const url = new URL(window.location.href); for (const key of [...Object.keys(initial), "query", "page"]) url.searchParams.delete(key); window.history.replaceState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); onApply() }}>Reset filters</button>
   </div>
   <p className="text-sm opacity-70 col-span-full">Budget filters compare only published inventory in the selected currency; GTH PRO does not apply hidden FX conversion. A currency is required whenever a budget is entered. Registry-only projects without matching inventory are not presented as priced listings.</p>
  </form>
 </details>
}
