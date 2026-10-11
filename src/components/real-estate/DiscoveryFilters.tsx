"use client"
import { useEffect, useState } from "react"
import styles from "./Listing.module.css"
export default function DiscoveryFilters({ onApply }: { onApply: () => void }) {
 const [filters, setFilters] = useState<Record<string,string>>({ country:"", city:"", type:"", listing:"", bedrooms:"", sort:"latest" })
 useEffect(() => {
  const sync = () => { const params = new URLSearchParams(window.location.search); setFilters(prev => Object.fromEntries(Object.keys(prev).map(key => [key, params.get(key) || (key === "sort" ? "latest" : "")]))) }
  sync()
  window.addEventListener("gth-discovery-filters", sync)
  window.addEventListener("popstate", sync)
  return () => { window.removeEventListener("gth-discovery-filters", sync); window.removeEventListener("popstate", sync) }
 }, [])
 return <details id="discovery-filters" className={`gth-glass ${styles.filterPanel}`}><summary>Refine your search <span className="text-sm font-normal opacity-70">· Location, type & bedrooms</span></summary><form className={styles.filterForm} onSubmit={event => { event.preventDefault(); const url = new URL(window.location.href); for (const [key,value] of Object.entries(filters)) { if (value) url.searchParams.set(key,value); else url.searchParams.delete(key) } url.searchParams.delete("page"); window.history.replaceState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); onApply() }}>
  {[{ key:"country", label:"Country" },{ key:"city", label:"City" }].map(field => <label key={field.key}>{field.label}<input  maxLength={80} value={filters[field.key]} onChange={e => setFilters(previous => ({...previous,[field.key]:e.target.value}))} /></label>)}
  {[{ key:"type",label:"Property type", options:["Apartment","Villa","Penthouse","Commercial","Plot"] },{ key:"listing",label:"Listing purpose",options:["buy","rent"] },{ key:"bedrooms",label:"Bedrooms",options:["1","2","3","4","5"] },{ key:"sort",label:"Sort",options:["latest","ai"] }].map(field => <label key={field.key}>{field.label}<select  value={filters[field.key]} onChange={e => setFilters({...filters,[field.key]:e.target.value})}><option value="">Any</option>{field.options.map(value => <option key={value} value={value}>{value === "ai" ? "Stored ranking" : value}</option>)}</select></label>)}
  <div className={styles.actions}>
   <button className={`gth-btn-gold ${styles.action}`}>Apply filters</button>
   <button type="button" className={`gth-btn ${styles.action}`} onClick={() => { const url = new URL(window.location.href); for (const key of [...Object.keys(filters), "query", "page"]) url.searchParams.delete(key); window.history.replaceState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); onApply() }}>Reset filters</button>
  </div>
  <p className="text-sm opacity-70 col-span-full">Coverage follows available inventory. Prices and availability require confirmation.</p>
 </form></details>
}
