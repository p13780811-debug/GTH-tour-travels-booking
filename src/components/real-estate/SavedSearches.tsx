"use client"
import { useEffect, useState } from "react"
import { normalizeSearches, normalizeSearchQuery, SEARCHES_KEY, type SavedSearch } from "@/lib/real-estate/saved-searches"
import styles from "./Listing.module.css"
export default function SavedSearches() {
 const [items,setItems] = useState<SavedSearch[]>([])
 const [message,setMessage] = useState("")
 useEffect(() => {
  const load = () => { try { setItems(normalizeSearches(JSON.parse(localStorage.getItem(SEARCHES_KEY) || "[]"))) } catch { setMessage("Saved searches are unavailable on this browser.") } }
  const changed = (event:StorageEvent) => { if (!event.key || event.key === SEARCHES_KEY) load() }
  load(); window.addEventListener("storage",changed); return () => window.removeEventListener("storage",changed)
 },[])
 const persist = (next:SavedSearch[]) => { try { localStorage.setItem(SEARCHES_KEY,JSON.stringify(next)); setItems(next); return true } catch { setMessage("This browser could not save the search."); return false } }
 const share=async()=>{try{const url=new URL("/real-estate",window.location.origin);url.search=normalizeSearchQuery(window.location.search);await navigator.clipboard.writeText(url.href);setMessage("Public search link copied. Private notes and saved properties are not included.")}catch{setMessage("Copy the page address from your browser to share the search.")}}
 return <details className={styles.savedSearches}><summary>Saved searches · {items.length}</summary><p className="text-sm opacity-70">Keep up to 10 private search shortcuts on this device for quick return visits.</p><div className={styles.savedSearchList}>{items.map(item => <div key={item.query}><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs text-[var(--text)]" onClick={() => { const url=new URL(window.location.href); url.search=normalizeSearchQuery(item.query); window.history.pushState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); window.dispatchEvent(new Event("gth-search-load")) }}>{item.label}</button><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs text-[var(--text)]" aria-label={`Remove saved search: ${item.label}`} onClick={() => {if(persist(items.filter(row => row.query !== item.query))) setMessage("Search removed")}}>×</button></div>)}</div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs text-[var(--text)]" onClick={() => { const query=normalizeSearchQuery(window.location.search); if(items.some(item=>item.query===query)) {setMessage("This search is already saved");return} if(items.length>=10) {setMessage("Remove a search before saving another");return} if(persist(normalizeSearches([...items,{query}]))) setMessage("Current search saved on this device") }}>Save current search</button><button type="button" className="gth-btn mt-3 min-h-11" onClick={()=>void share()}>Copy current search link</button>{message && <p role="status" className="text-sm mt-3">{message}</p>}</details>
}
