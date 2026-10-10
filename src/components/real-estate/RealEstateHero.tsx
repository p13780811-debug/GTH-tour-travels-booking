"use client"

import { ArrowDownRight, ArrowUpRight, Building2, Compass, Heart, MapPin, Search, ShieldCheck } from "lucide-react"
import Link from "next/link"
import BrandVideo from "@/components/brand/BrandVideo"
import styles from "./Listing.module.css"

type Props = {
  query: string
  setQuery: (value: string) => void
  onSearch: (value: string) => void
  loading?: boolean
}

export default function RealEstateHero({ query, setQuery, onSearch, loading = false }: Props) {
  return (
    <section className={styles.searchHero} aria-labelledby="estate-hero-title">
      <div className="gth-container">
        <div className={styles.heroStage}>
          <div className={styles.heroCopy}>
            <div className={styles.heroEyebrow}><span className={styles.heroPulse} aria-hidden="true" /> GTH PRO <span aria-hidden="true">/</span> GLOBAL REAL ESTATE</div>
            <h1 id="estate-hero-title" className={styles.searchTitle}>The world is full of places. <span className="gold-text">Find yours.</span></h1>
            <p className={styles.searchIntro}>One considered space for your next address, investment or opportunity. Explore available property records, compare what matters, and move forward with clarity.</p>
            <div className={styles.heroMicro}>
              <span><Compass size={16} aria-hidden="true" /> Global perspective</span>
              <span><ShieldCheck size={16} aria-hidden="true" /> Source-first discovery</span>
            </div>
            <form role="search" className={styles.heroSearch} onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
              <Search size={21} aria-hidden="true" className="gold-text" />
              <label className={styles.searchField}>
                <span>EXPLORE THE POSSIBILITY</span>
                <input type="search" name="property-search" autoComplete="off" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by city, locality or project" />
              </label>
              <button className={`gth-btn-gold ${styles.heroSubmit}`} disabled={loading} type="submit">{loading ? "Searching…" : "Explore"} <ArrowUpRight size={17} aria-hidden="true" /></button>
            </form>
            <nav className={styles.heroQuickLinks} aria-label="Popular property actions">
              <a href="#discovery-filters" onClick={() => { const panel = document.getElementById("discovery-filters") as HTMLDetailsElement | null; if (panel) panel.open = true }}><MapPin size={16} aria-hidden="true" /> Refine location</a>
              <Link href="/real-estate/saved"><Heart size={16} aria-hidden="true" /> Saved & compare</Link>
              <Link href="/real-estate/post-property"><Building2 size={16} aria-hidden="true" /> List a property</Link>
            </nav>
          </div>
          <figure className={styles.heroCinema}>
            <div className={styles.heroCinemaFrame}>
              <BrandVideo name="property-story" className={styles.heroCinemaVideo} label="AI-generated conceptual city and architecture brand film" />
              <span className={styles.heroFilmTag}>GTH PRO / VISUAL JOURNAL</span>
              <figcaption className={styles.heroCinemaCaption}><span>Beyond boundaries.<br />Closer to possibility.</span><ArrowUpRight size={24} aria-hidden="true" /></figcaption>
            </div>
            <p className={styles.heroCinemaDisclosure}>Conceptual AI-generated film, not footage of an available property.</p>
          </figure>
        </div>
        <div className={styles.heroBelow}>
          <p>CURATED DISCOVERY <span aria-hidden="true">/</span> INFORMED DECISIONS <span aria-hidden="true">/</span> REAL OPPORTUNITIES</p>
          <a href="#listing-results">Explore available properties <ArrowDownRight size={17} aria-hidden="true" /></a>
        </div>
        <p className={styles.heroDisclaimer}>Listings reflect currently available records. Property details, prices and availability require independent confirmation. Coverage varies by location.</p>
      </div>
    </section>
  )
}
