"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { User } from "@supabase/supabase-js"
import { LayoutGrid, Map, SlidersHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PropertyService, clearPropertyCache } from "@/lib/real-estate/propertyService"
import DiscoveryFilters from "@/components/real-estate/DiscoveryFilters"
import RealEstateHero from "@/components/real-estate/RealEstateHero"
import PropertyCardPro from "@/components/real-estate/PropertyCardPro"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Listing.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })
const PAGE_SIZE = 24
const categories = [{ label:"Buy", value:"buy" },{ label:"Rent", value:"rent" },{ label:"Apartments", value:"Apartment" },{ label:"Villas", value:"Villa" },{ label:"Commercial", value:"Commercial" },{ label:"Plots", value:"Plot" }]

export default function RealEstatePage() {
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<any[]>([])
    const [query, setQuery] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [showLogin, setShowLogin] = useState(false)
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
        const channel = supabase.channel("estate-inventory").on("postgres_changes", { event:"*", schema:"public", table:"properties" }, () => { clearPropertyCache(); load() }).subscribe()
        return () => { active = false; request.current += 1; auth.subscription.unsubscribe(); window.removeEventListener("popstate", onHistory); supabase.removeChannel(channel) }
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
        for (const key of ["query", "page", "type", "listing"]) url.searchParams.delete(key)
        url.searchParams.set(value === "buy" || value === "rent" ? "listing" : "type", value)
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const reset = () => {
        const url = new URL(window.location.href)
        for (const key of ["query","page","country","city","type","listing","bedrooms","sort"]) url.searchParams.delete(key)
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const coordinates = properties.filter(property => typeof property.lat === "number" && typeof property.lng === "number" && Number.isFinite(property.lat) && Number.isFinite(property.lng) && Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180)

    return <main className="min-h-screen pb-28 md:pb-16">
        <nav aria-label="Real estate navigation" className={`gth-container ${styles.localNav}`}>
            <Link href="/real-estate" className="gold-text font-bold tracking-wide">GTH PRO / Real Estate</Link>
            <div className="flex items-center gap-4 flex-wrap"><Link href="/real-estate/saved">Saved & compare</Link><Link href="/real-estate/post-property" className={`gth-btn-gold ${styles.action}`}>List a property</Link>{user ? <Link href="/real-estate/profile">My account</Link> : <button className={`gth-btn ${styles.action}`} onClick={() => setShowLogin(true)}>Sign in</button>}</div>
        </nav>
        <div id="property-search" className="scroll-mt-24"><RealEstateHero query={query} setQuery={setQuery} onSearch={updateSearch} loading={loading} /></div>
        <div className="gth-container">
            <section aria-label="Browse property categories" className="flex gap-3 flex-wrap mb-8">{categories.map(category => <button key={category.value} className={`gth-btn ${styles.action}`} onClick={() => applyCategory(category.value)} disabled={loading}>{category.label}</button>)}</section>
            <DiscoveryFilters onApply={() => { clearPropertyCache(); load(1) }} />
            <section id="listing-results" className="scroll-mt-24 mt-10" aria-busy={loading}>
                <header className="flex items-center justify-between gap-5 flex-wrap mb-6">
                    <div><p className="gold-text text-xs uppercase tracking-widest">Explore the collection</p><h2 className="text-3xl font-bold mt-2">Available listings</h2><p className="opacity-70 text-sm mt-2" role="status">{loading ? "Loading listings…" : error ? "Inventory temporarily unavailable" : `${properties.length} listings on page ${page}`}</p></div>
                    <div className="flex gap-2 flex-wrap"><button className={`gth-btn ${styles.action}`} aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutGrid size={16} aria-hidden="true" />Listings</button><button className={`gth-btn ${styles.action}`} aria-pressed={view === "map"} onClick={() => setView("map")}><Map size={16} aria-hidden="true" />Map</button><button className={`gth-btn ${styles.action}`} onClick={() => document.getElementById("discovery-filters")?.scrollIntoView({ block:"start" })}><SlidersHorizontal size={16} aria-hidden="true" />Filters</button></div>
                </header>
                {error && <div className="gth-glass rounded-3xl p-8" role="alert"><h3 className="font-bold">We could not load the inventory</h3><p className="opacity-70 mt-3">{error}</p><button className={`gth-btn-gold ${styles.action} mt-5`} onClick={() => load(page)}>Retry</button></div>}
                {!loading && !error && properties.length === 0 && <div className="gth-glass rounded-3xl p-8"><h3 className="text-xl font-bold">{page > 1 ? "You have reached the end of these results" : "No listings match this search"}</h3><p className="opacity-70 mt-3">Try a broader location or remove a filter. Inventory reflects the records currently available.</p><button className={`gth-btn ${styles.action} mt-5`} onClick={reset}>Clear search and filters</button></div>}
                {!error && view === "map" && <div className="gth-glass rounded-3xl p-5 mb-6"><p className="text-sm opacity-70 mb-4">{coordinates.length} listings on this page have stored coordinates. Map pins are not a measurement or location verification.</p>{coordinates.length ? <div className="h-[450px] rounded-2xl overflow-hidden"><MapWrapper data={coordinates} /></div> : <p>No mapped listings on this page. Switch to Listings to explore the available records.</p>}</div>}
                {!error && view === "list" && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{properties.map(property => <PropertyCardPro key={property.id} p={property} />)}</div>}
                <nav aria-label="Listing pages" className="flex items-center justify-center gap-4 mt-10 flex-wrap"><button className={`gth-btn ${styles.action}`} disabled={loading || page === 1} onClick={() => load(page - 1)}>Previous</button><span>Page {page}</span><button className={`gth-btn ${styles.action}`} disabled={loading || Boolean(error) || properties.length < PAGE_SIZE} onClick={() => load(page + 1)}>Next</button></nav>
            </section>
            <section className="gth-glass rounded-3xl p-6 md:p-8 mt-14 flex items-center justify-between gap-6 flex-wrap"><div><h2 className="text-2xl font-bold">Have a property to share?</h2><p className="opacity-70 mt-3">Submit accurate details for review before publication.</p></div><Link href="/real-estate/post-property" className={`gth-btn-gold ${styles.action}`}>Submit your listing</Link></section>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        <BottomNav user={user} />
    </main>
}
