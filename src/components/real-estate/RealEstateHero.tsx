"use client"

import { Search, Building2, MapPin, Heart } from "lucide-react"
import Link from "next/link"
import styles from "./Listing.module.css"

type Props = { query: string; setQuery: (value: string) => void; onSearch: (value: string) => void; loading?: boolean; intent?: string; onIntent?: (value:string) => void }

export default function RealEstateHero({ query, setQuery, onSearch, loading, intent, onIntent }: Props) {
 return <section className={styles.searchHero}>
  <div className="gth-container">
   <div className={styles.heroTop}>
    <div className={styles.heroCopy}>
     <p className="gold-text text-xs font-bold uppercase tracking-widest">GTH PRO / Global Real Estate</p>
     <h1 className={styles.searchTitle}>Discover property with <span className="gold-text">confidence.</span></h1>
     <p className={styles.searchIntro}>Explore project records, reviewed inventory and property opportunities across important global markets — with source transparency built into every step.</p>
    </div>
   </div>
   {onIntent && <div className={styles.intentTabs} aria-label="Property search purpose">{[{label:"Buy",value:"buy"},{label:"Rent",value:"rent"}].map(item => <button type="button" key={item.value} aria-pressed={intent === item.value} disabled={loading} onClick={() => onIntent(item.value)} className={`gth-btn ${styles.action}`}>{item.label}</button>)}</div>}
   <form className={`gth-glass ${styles.searchBar}`} onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
    <Search size={24} className="gold-text" aria-hidden="true" />
    <label className={styles.searchField}><span className="text-xs opacity-70">Search a market, city or project</span><input type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Mumbai, Dubai, London, project name or registration reference" /></label>
    <button type="submit" className={`gth-btn-gold ${styles.action}`} disabled={loading}>{loading ? "Searching…" : "Search properties"}</button>
   </form>
   <div className={styles.heroLinks}><a href="#discovery-filters" onClick={() => { const panel = document.getElementById("discovery-filters") as HTMLDetailsElement | null; if (panel) panel.open = true }}><MapPin size={16} aria-hidden="true" />Explore global markets</a><Link href="/real-estate/saved"><Heart size={16} aria-hidden="true" />Build a shortlist</Link><Link href="/real-estate/post-property"><Building2 size={16} aria-hidden="true" />List your property</Link></div>
   <p className="text-xs opacity-70 mt-5">Global coverage expands with verified sources and reviewed inventory. Prices, availability and property status should always be confirmed before commitment.</p>
  </div>
 </section>
}
