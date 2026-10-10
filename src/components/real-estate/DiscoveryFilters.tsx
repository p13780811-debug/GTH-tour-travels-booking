"use client"
import { useEffect, useState } from "react"
export default function DiscoveryFilters({ onApply }: { onApply: () => void }) {
 const [filters, setFilters] = useState<Record<string,string>>({ country:"", city:"", type:"", listing:"", bedrooms:"", sort:"latest" })
 useEffect(() => {
  const sync = () => { const params = new URLSearchParams(window.location.search); setFilters(prev => Object.fromEntries(Object.keys(prev).map(key => [key, params.get(key) || (key === "sort" ? "latest" : "")]))) }
  sync()
  window.addEventListener("gth-discovery-filters", sync)
  window.addEventListener("popstate", sync)
  return () => { window.removeEventListener("gth-discovery-filters", sync); window.removeEventListener("popstate", sync) }
 }, [])
 return <form id="discovery-filters" className="gth-glass rounded-3xl p-5 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={event => { event.preventDefault(); const url = new URL(window.location.href); for (const [key,value] of Object.entries(filters)) { if (value) url.searchParams.set(key,value); else url.searchParams.delete(key) } window.history.replaceState(null,"",url); onApply() }}>
  {[{ key:"country", label:"Country" },{ key:"city", label:"City" }].map(field => <label key={field.key}>{field.label}<input className="gth-glass p-3 rounded-xl w-full" maxLength={80} value={filters[field.key]} onChange={e => setFilters({...filters,[field.key]:e.target.value})} /></label>)}
  {[{ key:"type",label:"Property type", options:["Apartment","Villa","Penthouse","Commercial","Plot"] },{ key:"listing",label:"Listing purpose",options:["buy","rent"] },{ key:"bedrooms",label:"Bedrooms",options:["1","2","3","4","5"] },{ key:"sort",label:"Sort",options:["latest","ai"] }].map(field => <label key={field.key}>{field.label}<select className="gth-glass bg-[var(--card)] p-3 rounded-xl w-full" value={filters[field.key]} onChange={e => setFilters({...filters,[field.key]:e.target.value})}><option value="">Any</option>{field.options.map(value => <option key={value} value={value}>{value === "ai" ? "Stored ranking" : value}</option>)}</select></label>)}
  <button className="gth-btn-gold">Apply filters</button>
  <button type="button" className="gth-btn" onClick={() => { const url = new URL(window.location.href); for (const key of [...Object.keys(filters), "query"]) url.searchParams.delete(key); window.history.replaceState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); onApply() }}>Reset search and filters</button>
  <p className="text-sm text-[var(--muted)]">Coverage follows available inventory. Prices and availability require confirmation.</p>
 </form>
}
