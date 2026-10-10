"use client"

import { Search, Building2, MapPin, Heart } from "lucide-react"
import Link from "next/link"
import styles from "./Listing.module.css"

type Props = { query: string; setQuery: (value: string) => void; onSearch: (value: string) => void; loading?: boolean }

export default function RealEstateHero({ query, setQuery, onSearch, loading }: Props) {
 return <section className={styles.searchHero}>
  <div className="gth-container">
   <p className="gold-text text-xs font-bold uppercase tracking-widest">GTH PRO / Real Estate</p>
   <h1 className={styles.searchTitle}>Find a place.<br /><span className="gold-text">Make it your next move.</span></h1>
   <p className={styles.searchIntro}>Explore homes, commercial spaces and land. Search available project records, compare the details and enquire with confidence.</p>
   <form className={`gth-glass ${styles.searchBar}`} onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
    <Search size={24} className="gold-text" aria-hidden="true" />
    <label className={styles.searchField}><span className="text-xs opacity-70">Where are you looking?</span><input type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="City, locality or project name" /></label>
    <button type="submit" className={`gth-btn-gold ${styles.action}`} disabled={loading}>{loading ? "Searching…" : "Search properties"}</button>
   </form>
   <div className={styles.heroLinks}><a href="#discovery-filters" onClick={() => { const panel = document.getElementById("discovery-filters") as HTMLDetailsElement | null; if (panel) panel.open = true }}><MapPin size={16} aria-hidden="true" />Choose your location</a><Link href="/real-estate/saved"><Heart size={16} aria-hidden="true" />Build a shortlist</Link><Link href="/real-estate/post-property"><Building2 size={16} aria-hidden="true" />List your property</Link></div>
   <p className="text-xs opacity-70 mt-5">Coverage follows available inventory. Listed prices and availability require confirmation.</p>
  </div>
 </section>
}
