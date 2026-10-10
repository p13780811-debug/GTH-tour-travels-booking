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
 return <details className={styles.savedSearches}><summary>Saved searches · {items.length}</summary><p className="text-sm opacity-70">Keep up to 10 searches on this device. Email alerts and account sync are not enabled.</p><div className={styles.savedSearchList}>{items.map(item => <div key={item.query}><button className={`gth-btn ${styles.action}`} onClick={() => { const url=new URL(window.location.href); url.search=normalizeSearchQuery(item.query); window.history.pushState(null,"",url); window.dispatchEvent(new Event("gth-discovery-filters")); window.dispatchEvent(new Event("gth-search-load")) }}>{item.label}</button><button className={`gth-btn ${styles.action}`} aria-label={`Remove saved search: ${item.label}`} onClick={() => {if(persist(items.filter(row => row.query !== item.query))) setMessage("Search removed")}}>×</button></div>)}</div><button className={`gth-btn ${styles.action}`} onClick={() => { const query=normalizeSearchQuery(window.location.search); if(items.some(item=>item.query===query)) {setMessage("This search is already saved");return} if(items.length>=10) {setMessage("Remove a search before saving another");return} if(persist(normalizeSearches([...items,{query}]))) setMessage("Current search saved on this device") }}>Save current search</button>{message && <p role="status" className="text-sm mt-3">{message}</p>}</details>
}
