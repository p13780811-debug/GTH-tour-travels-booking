"use client"

import { Search } from "lucide-react"
import styles from "./Listing.module.css"

type Props = {
    query: string
    setQuery: (value: string) => void
    onSearch: (value: string) => void
    loading?: boolean
    properties?: unknown[]
    setFiltered?: unknown
    setActive?: unknown
}

export default function RealEstateHero({ query, setQuery, onSearch, loading }: Props) {
    return (
        <section className="relative px-4 py-16 md:py-24">
            <div aria-hidden="true" className="gth-grid-luxury absolute inset-0 opacity-10 pointer-events-none" />
            <div className={`relative mx-auto max-w-7xl ${styles.discoveryHeader}`}>
              <div>
                <span className="gth-badge mb-5">GTH PRO Real Estate</span>
                <h1 className={styles.projectTitle}>A place for your<br /><span className="gold-text">next chapter.</span></h1>
                <p className="mt-5 opacity-70 leading-8 max-w-2xl">From the first search to the right questions. Explore recorded project details and find the listings worth a closer look.</p>
                <form className="gth-glass mt-8 rounded-3xl p-4 flex flex-col sm:flex-row gap-3" onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
                    <label className="flex-1 text-left">
                        <span className="sr-only">Project name, city or location</span>
                        <input type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Project name, city or location" className="w-full rounded-xl p-4 bg-[var(--card)] text-[var(--text)] border border-[var(--border)]" />
                    </label>
                    <button type="submit" className={`gth-btn-gold ${styles.action}`} disabled={loading}><Search size={18} aria-hidden="true" />{loading ? "Searching…" : "Search listings"}</button>
                </form>
                <p className="text-sm opacity-70 mt-4">Search by project, city or location. Coverage follows available inventory.</p>
              </div>
              <aside className={styles.discoveryStory} aria-label="Your property journey">
                {[{ number:"01", title:"Find your direction", text:"Narrow the search by city, property type and listing purpose." },{ number:"02", title:"Look beyond the headline", text:"Review recorded project facts, media and available location details." },{ number:"03", title:"Make the next move", text:"Ask the listing team to confirm pricing, availability and a visit." }].map(step => <div key={step.number}><p className="gold-text text-xs tracking-widest">{step.number}</p><h2 className="text-xl font-bold mt-2">{step.title}</h2><p className="text-sm leading-7 opacity-70 mt-2">{step.text}</p></div>)}
              </aside>
            </div>
        </section>
    )
}
