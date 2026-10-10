"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { User } from "@supabase/supabase-js"
import { LayoutGrid, Map, SlidersHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PropertyService, clearPropertyCache } from "@/lib/real-estate/propertyService"
import DiscoveryFilters from "@/components/real-estate/DiscoveryFilters"
import SavedSearches from "@/components/real-estate/SavedSearches"
import RealEstateHero from "@/components/real-estate/RealEstateHero"
import PropertyCardPro from "@/components/real-estate/PropertyCardPro"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Listing.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })
const PAGE_SIZE = 24
const categories = [{ label:"Apartments", value:"Apartment" },{ label:"Villas", value:"Villa" },{ label:"Commercial", value:"Commercial" },{ label:"Plots", value:"Plot" }]

export default function RealEstatePage() {
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<any[]>([])
    const [activeFilters, setActiveFilters] = useState<[string, string][]>([])
    const [query, setQuery] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [view, setView] = useState<"list" | "map">("list")
    const request = useRef(0)

    const load = useCallback(async (requestedPage?: number) => {
        const current = ++request.current
        const url = new URL(window.location.href)
        const storedPage = Number(url.searchParams.get("page"))
        const nextPage = requestedPage ?? (Number.isInteger(storedPage) && storedPage > 0 && storedPage <= 10000 ? storedPage : 1)
        const params = url.searchParams
        const text = (key: string) => (params.get(key) || "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 80) || undefined
        const bedrooms = Number(params.get("bedrooms"))
        setActiveFilters([...params.entries()].filter(([key,value]) => ["query","country","city","type","listing","bedrooms"].includes(key) && Boolean(value)))
        setLoading(true)
        setError("")
        setQuery((params.get("query") || "").slice(0, 120))
        try {
            const data = await PropertyService.getAll({ limit: PAGE_SIZE, page: nextPage, query: params.get("query")?.slice(0, 120) || undefined, country: text("country"), city: text("city"), type: text("type"), listing: ["buy","rent"].includes(params.get("listing") || "") ? params.get("listing")! : undefined, bedrooms: Number.isInteger(bedrooms) && bedrooms > 0 && bedrooms <= 20 ? bedrooms : undefined, sort: params.get("sort") === "ai" ? "ai" : "latest" })
            if (current !== request.current) return
            setProperties(data)
            setPage(nextPage)
            if (nextPage > 1) url.searchParams.set("page", String(nextPage))
            else url.searchParams.delete("page")
            window.history.replaceState(null, "", url)
        } catch {
            if (current === request.current) { setProperties([]); setError("Listings could not be loaded. Please retry.") }
        } finally { if (current === request.current) setLoading(false) }
    }, [])

    useEffect(() => {
        let active = true
        load()
        supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user) })
        const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
        const onHistory = () => { load() }
        window.addEventListener("popstate", onHistory)
        window.addEventListener("gth-search-load", onHistory)
        const channel = supabase.channel("estate-inventory").on("postgres_changes", { event:"*", schema:"public", table:"properties" }, () => { clearPropertyCache(); load() }).subscribe()
        return () => { active = false; request.current += 1; auth.subscription.unsubscribe(); window.removeEventListener("popstate", onHistory); window.removeEventListener("gth-search-load", onHistory); supabase.removeChannel(channel) }
    }, [load])

    const updateSearch = (term: string) => {
        const url = new URL(window.location.href)
        if (term.trim()) url.searchParams.set("query", term.trim().slice(0, 120))
        else url.searchParams.delete("query")
        url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        load(1)
        document.getElementById("listing-results")?.scrollIntoView({ block:"start" })
    }
    const applyCategory = (value: string) => {
        const url = new URL(window.location.href)
        for (const key of ["page", ...(value === "buy" || value === "rent" ? ["listing"] : ["type"])]) url.searchParams.delete(key)
        url.searchParams.set(value === "buy" || value === "rent" ? "listing" : "type", value)
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const openFilters = () => {
        const panel = document.getElementById("discovery-filters") as HTMLDetailsElement | null
        if (panel) { panel.open = true; panel.scrollIntoView({ block:"start" }); panel.querySelector("summary")?.focus() }
    }
    const removeFilter = (key: string) => {
        const url = new URL(window.location.href)
        url.searchParams.delete(key); url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters")); load(1)
    }
    const reset = () => {
        const url = new URL(window.location.href)
        for (const key of ["query","page","country","city","type","listing","bedrooms","sort"]) url.searchParams.delete(key)
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const changePage = (next:number) => { load(next); document.getElementById("listing-results")?.scrollIntoView({block:"start"}) }
    const coordinates = properties.filter(property => typeof property.lat === "number" && typeof property.lng === "number" && Number.isFinite(property.lat) && Number.isFinite(property.lng) && Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180)

    return <main className="min-h-screen pb-28 md:pb-16">
        <div id="property-search" className="scroll-mt-24"><RealEstateHero query={query} setQuery={setQuery} onSearch={updateSearch} loading={loading} intent={activeFilters.find(([key]) => key === "listing")?.[1] || ""} onIntent={applyCategory} /></div>
        <div className="gth-container">
            <section aria-label="Browse property categories" className={styles.browseBar}>{categories.map(category => <button key={category.value} aria-pressed={activeFilters.some(([key,value]) => (key === "type" || key === "listing") && value === category.value)} className={`gth-btn ${styles.action}`} onClick={() => applyCategory(category.value)} disabled={loading}>{category.label}</button>)}</section>
            <SavedSearches />
            <DiscoveryFilters onApply={() => { clearPropertyCache(); load(1) }} />
            {activeFilters.length > 0 && <div className={styles.filterChips} aria-label="Active filters">{activeFilters.map(([key,value]) => <button key={key} onClick={() => removeFilter(key)} aria-label={`Remove ${key} filter: ${value.slice(0,120)}`}>{key}: {value.slice(0,120)} <span aria-hidden="true">×</span></button>)}<button onClick={reset}>Clear all</button></div>}
            <section id="listing-results" className="scroll-mt-24 mt-10" aria-busy={loading}>
                <header className="flex items-center justify-between gap-5 flex-wrap mb-6">
                    <div><p className="gold-text text-xs uppercase tracking-widest">Property discovery</p><h2 className="text-3xl font-bold mt-2">Explore properties</h2><p className="opacity-70 text-sm mt-2" role="status">{loading ? "Loading listings…" : error ? "Inventory temporarily unavailable" : `${properties.length} listings on page ${page}`}</p></div>
                    <div className="flex gap-2 flex-wrap"><button className={`gth-btn ${styles.action}`} aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutGrid size={16} aria-hidden="true" />Listings</button><button className={`gth-btn ${styles.action}`} aria-pressed={view === "map"} onClick={() => setView("map")}><Map size={16} aria-hidden="true" />Map</button><button className={`gth-btn ${styles.action}`} onClick={openFilters}><SlidersHorizontal size={16} aria-hidden="true" />Filters</button></div>
                </header>
                {loading && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" aria-hidden="true">{Array.from({length:6},(_,index) => <div key={index} className={`gth-glass ${styles.skeleton}`}><div className={styles.skeletonMedia} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /></div>)}</div>}
                {error && <div className="gth-glass rounded-3xl p-8" role="alert"><h3 className="font-bold">We could not load the inventory</h3><p className="opacity-70 mt-3">{error}</p><button className={`gth-btn-gold ${styles.action} mt-5`} onClick={() => load(page)}>Retry</button></div>}
                {!loading && !error && properties.length === 0 && <div className="gth-glass rounded-3xl p-8"><h3 className="text-xl font-bold">{page > 1 ? "You have reached the end of these results" : "No listings match this search"}</h3><p className="opacity-70 mt-3">Try a broader location or remove a filter. Inventory reflects the records currently available.</p><button className={`gth-btn ${styles.action} mt-5`} onClick={reset}>Clear search and filters</button></div>}
                {!loading && !error && view === "map" && <div className="gth-glass rounded-3xl p-5 mb-6"><p className="text-sm opacity-70 mb-4">{coordinates.length} listings on this page have stored coordinates. Map pins are not a measurement or location verification.</p>{coordinates.length ? <div className="h-[450px] rounded-2xl overflow-hidden"><MapWrapper data={coordinates} /></div> : <p>No mapped listings on this page. Switch to Listings to explore the available records.</p>}</div>}
                {!loading && !error && view === "list" && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{properties.map(property => <PropertyCardPro key={property.id} p={property} />)}</div>}
                <nav aria-label="Listing pages" className="flex items-center justify-center gap-4 mt-10 flex-wrap"><button className={`gth-btn ${styles.action}`} disabled={loading || page === 1} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page}</span><button className={`gth-btn ${styles.action}`} disabled={loading || Boolean(error) || properties.length < PAGE_SIZE} onClick={() => changePage(page + 1)}>Next</button></nav>
            </section>
            <section className="mt-14" aria-labelledby="buyer-guide"><p className="gold-text text-xs uppercase tracking-widest">Before your next move</p><h2 id="buyer-guide" className="text-2xl font-bold mt-3">A clearer way to explore property</h2><div className={styles.guideGrid}>{[{title:"Review the records",text:"Check the registration reference, developer and recorded project details. Registration is not a guarantee of delivery."},{title:"Compare what matters",text:"Save listings and compare location, reported area and available specifications on this device."},{title:"Confirm before committing",text:"Ask for current pricing, legal documents and a site visit before making a payment or decision."}].map(item => <article key={item.title} className="gth-glass"><h3 className="font-bold">{item.title}</h3><p className="text-sm opacity-70 leading-7 mt-3">{item.text}</p></article>)}</div></section>
            <section className="gth-glass rounded-3xl p-6 md:p-8 mt-14 flex items-center justify-between gap-6 flex-wrap"><div><h2 className="text-2xl font-bold">Have a property to share?</h2><p className="opacity-70 mt-3">Submit accurate details for review before publication.</p></div><Link href="/real-estate/post-property" className={`gth-btn-gold ${styles.action}`}>Submit your listing</Link></section>
        </div>
        <BottomNav user={user} />
    </main>
}
