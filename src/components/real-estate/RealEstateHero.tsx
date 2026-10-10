"use client"

import { Search } from "lucide-react"

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
        <section className="relative bg-[var(--bg)] text-[var(--text)] px-4 py-16 md:py-24">
            <div aria-hidden="true" className="gth-grid-luxury absolute inset-0 opacity-10 pointer-events-none" />
            <div className="relative mx-auto max-w-4xl text-center">
                <span className="gth-badge mb-5">GTH PRO Real Estate</span>
                <h1 className="gth-title text-4xl md:text-6xl">Find your next <span className="gold-text">property</span></h1>
                <p className="mt-5 text-[var(--muted)]">Explore available listings by project name, city or location. Confirm prices and availability with the listing contact.</p>
                <form className="gth-glass mt-8 rounded-3xl p-4 flex flex-col sm:flex-row gap-3" onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
                    <label className="flex-1 text-left">
                        <span className="sr-only">Project name, city or location</span>
                        <input type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Project name, city or location" className="w-full rounded-xl p-4 bg-[var(--card)] text-[var(--text)] border border-[var(--border)]" />
                    </label>
                    <button type="submit" className="gth-btn-gold flex items-center justify-center gap-2" disabled={loading}><Search size={18} aria-hidden="true" />{loading ? "Searching…" : "Search listings"}</button>
                </form>
                <p className="text-sm text-[var(--muted)] mt-4">Use the filters below for property type, bedrooms and buy or rent. Coverage follows available inventory.</p>
            </div>
        </section>
    )
}
