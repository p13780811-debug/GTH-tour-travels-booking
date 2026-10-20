"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { User } from "@supabase/supabase-js"
import { ArrowUpRight, Check, Compass, GitCompareArrows, Heart, Info, LayoutGrid, LockKeyhole, Map, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PropertyService, clearPropertyCache } from "@/lib/real-estate/propertyService"
import DiscoveryFilters from "@/components/real-estate/DiscoveryFilters"
import SavedSearches from "@/components/real-estate/SavedSearches"
import ExplorerHero from "@/components/real-estate/ExplorerHero"
import ExplorerCard from "@/components/real-estate/ExplorerCard"
import ExplorerDialog, { type ExplorerDialogState } from "@/components/real-estate/ExplorerDialog"
import { compareSelection, type ExplorerProperty } from "@/lib/real-estate/explorer"
import { getPublishedProjectMedia } from "@/lib/property-media/published-media"
import { normalizeSaved, SAVED_KEY } from "@/lib/real-estate/saved"
import GlobalMarkets from "@/components/real-estate/GlobalMarkets"
import PartnerHandshake from "@/components/property/PartnerHandshake"
import TrustStandard from "@/components/real-estate/TrustStandard"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Explorer.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })
const PAGE_SIZE = 24

export default function RealEstatePage() {
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<ExplorerProperty[]>([])
    const [activeFilters, setActiveFilters] = useState<[string, string][]>([])
    const [query, setQuery] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [view, setView] = useState<"list" | "map">("list")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [compared, setCompared] = useState<ExplorerProperty[]>([])
    const [savedCount, setSavedCount] = useState(0)
    const [dialog, setDialog] = useState<ExplorerDialogState | null>(null)
    const sidebar = useRef<HTMLElement>(null)
    const filterToggle = useRef<HTMLButtonElement>(null)
    const closeFilter = useRef<HTMLButtonElement>(null)
    const touchStartY = useRef<number | null>(null)
    const request = useRef(0)

    const load = useCallback(async (requestedPage?: number) => {
        const current = ++request.current
        const url = new URL(window.location.href)
        const storedPage = Number(url.searchParams.get("page"))
        const nextPage = requestedPage ?? (Number.isInteger(storedPage) && storedPage > 0 && storedPage <= 10000 ? storedPage : 1)
        const params = url.searchParams
        const text = (key: string) => (params.get(key) || "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 80) || undefined
        const bedrooms = Number(params.get("bedrooms"))
        setActiveFilters([...params.entries()].filter(([key,value]) => ["query","country","city","type","listing","bedrooms","currency","minPrice","maxPrice","sort"].includes(key) && Boolean(value)))
        setLoading(true)
        setError("")
        setQuery((params.get("query") || "").slice(0, 120))
        try {
            const positive = (key: string) => { const value = Number(params.get(key)); return Number.isFinite(value) && value > 0 ? value : undefined }
            const sort = params.get("sort")
            const data = await PropertyService.getAll({ limit: PAGE_SIZE, page: nextPage, query: params.get("query")?.slice(0, 120) || undefined, country: text("country"), city: text("city"), type: (() => { const value = params.get("type")?.trim(); return value && /^[\p{L}\p{N}\s/-]{1,80}$/u.test(value) ? value : undefined })(), listing: ["buy","rent"].includes(params.get("listing") || "") ? params.get("listing")! : undefined, bedrooms: Number.isInteger(bedrooms) && bedrooms > 0 && bedrooms <= 20 ? bedrooms : undefined, minPrice: positive("minPrice"), maxPrice: positive("maxPrice"), currency: text("currency"), sort: sort === "ai" || sort === "price_low" || sort === "price_high" ? sort : "latest" })
            if (current !== request.current) return
            const visibleMedia = await getPublishedProjectMedia(data.map((item: ExplorerProperty) => Number(item.id)))
            if (current !== request.current) return
            setProperties(data.map((item: ExplorerProperty) => ({...item,publishedMedia:visibleMedia.filter(m=>Number(m.project_id)===Number(item.id))})))
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
        supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user) }).catch(() => { /* Public discovery stays available without a session. */ })
        const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
        const onHistory = () => { setFiltersOpen(false); load() }
        window.addEventListener("popstate", onHistory)
        window.addEventListener("gth-search-load", onHistory)
        const channel = supabase.channel("estate-inventory").on("postgres_changes", { event:"*", schema:"public", table:"properties" }, () => { clearPropertyCache(); load() }).on("postgres_changes", { event:"*", schema:"public", table:"property_inventory" }, () => { clearPropertyCache(); load() }).subscribe()
        return () => { active = false; request.current += 1; auth.subscription.unsubscribe(); window.removeEventListener("popstate", onHistory); window.removeEventListener("gth-search-load", onHistory); supabase.removeChannel(channel) }
    }, [load])

    useEffect(() => {
        const sync = () => { try { setSavedCount(normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")).length) } catch { setSavedCount(0) } }
        sync(); window.addEventListener("gth-saved", sync); window.addEventListener("storage", sync)
        return () => { window.removeEventListener("gth-saved", sync); window.removeEventListener("storage", sync) }
    }, [])

    // Inline responsive filters scroll with the page, not inside a viewport-locked dialog.
    useEffect(() => {
        if (!filtersOpen) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") { setFiltersOpen(false); filterToggle.current?.focus() }
            if (event.key === "Tab" && window.innerWidth <= 960 && sidebar.current) {
                const focusables = [...sidebar.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
                if (!focusables.length) return;
                const first = focusables[0], last = focusables[focusables.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
            }
        }
        const onResize = () => { if (window.innerWidth > 960) setFiltersOpen(false) }
        if (window.innerWidth <= 960) {
            const oldOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            closeFilter.current?.focus();
            window.addEventListener("keydown", onKey);
            window.addEventListener("resize", onResize);
            return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize) }
        }
        window.addEventListener("keydown", onKey)
        window.addEventListener("resize", onResize)
        return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize) }
    }, [filtersOpen])

    const updateSearch = (term: string) => {
        const url = new URL(window.location.href)
        if (term.trim()) url.searchParams.set("query", term.trim().slice(0, 120))
        else url.searchParams.delete("query")
        url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        load(1)
        document.getElementById("listing-results")?.scrollIntoView({ block:"start" })
    }
    const applyIntent = (value: string) => {
        const url = new URL(window.location.href)
        url.searchParams.delete("page")
        if (value) url.searchParams.set("listing", value)
        else url.searchParams.delete("listing")
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const openFilters = () => {
        if (window.innerWidth <= 960) setFiltersOpen(previous => !previous)
        else sidebar.current?.querySelector<HTMLInputElement>("input")?.focus()
    }
    const removeFilter = (key: string) => {
        const url = new URL(window.location.href)
        url.searchParams.delete(key); url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters")); load(1)
    }
    const reset = () => {
        const url = new URL(window.location.href)
        for (const key of ["query","page","country","city","type","listing","bedrooms","currency","minPrice","maxPrice","sort"]) url.searchParams.delete(key)
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const changePage = (next:number) => { load(next); document.getElementById("listing-results")?.scrollIntoView({block:"start"}) }
    const coordinates = properties.filter(property => typeof property.lat === "number" && typeof property.lng === "number" && Number.isFinite(property.lat) && Number.isFinite(property.lng) && Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180)

    const showInfo = (kind: "ranking" | "verification", property?: ExplorerProperty) => setDialog({ kind, property })
    const sort = activeFilters.find(([key]) => key === "sort")?.[1] || "latest"
    const setSort = (value: string) => {
        const url = new URL(window.location.href)
        if (value === "latest") url.searchParams.delete("sort")
        else url.searchParams.set("sort", value)
        url.searchParams.delete("page"); window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters")); load(1)
    }
    return <main className={`gth-container ${styles.page}`}>
        <div id="property-search" className="scroll-mt-24"><ExplorerHero query={query} onQuery={setQuery} onSearch={updateSearch} loading={loading} intent={activeFilters.find(([key]) => key === "listing")?.[1] || ""} onIntent={applyIntent} onInfo={showInfo} /></div>
        <nav className={styles.workspaceNav} aria-label="Property workspace"><a href="#listing-results">Discover</a><Link href="/real-estate/saved"><Heart size={14} />Shortlist<span>{savedCount}</span></Link><button onClick={() => setDialog({ kind:"compare", properties:compared })}><GitCompareArrows size={14} />Compare<span>{compared.length}</span></button><Link href="/real-estate/post-property">Submit a property<ArrowUpRight size={14} /></Link></nav>
        <button ref={filterToggle} className={styles.filterToggle} onClick={openFilters} aria-controls="explorer-filter-panel" aria-expanded={filtersOpen}><SlidersHorizontal size={14} />{filtersOpen ? "Hide filters" : "Filters"}</button>
        <button type="button" aria-label="Close property filters" tabIndex={filtersOpen ? 0 : -1} className={styles.scrim} data-open={filtersOpen} onClick={() => { setFiltersOpen(false); filterToggle.current?.focus() }} />
        <div className={styles.workspace}>
            <aside ref={sidebar} id="explorer-filter-panel" className={styles.sidebar} data-open={filtersOpen} aria-labelledby="explorer-filter-title" role={filtersOpen ? "dialog" : undefined} aria-modal={filtersOpen ? true : undefined}>
                <button type="button" className={styles.sheetHandle} aria-label="Swipe down or tap to close filters" onTouchStart={event => { touchStartY.current = event.touches[0]?.clientY ?? null }} onTouchEnd={event => { const last = event.changedTouches[0]?.clientY; if (last != null && touchStartY.current != null && last - touchStartY.current > 65) { setFiltersOpen(false); filterToggle.current?.focus() } touchStartY.current = null }} onClick={() => { setFiltersOpen(false); filterToggle.current?.focus() }}><span /></button>
                <div className={styles.sidebarHeader}><h2 id="explorer-filter-title"><SlidersHorizontal size={15} />Refine your search</h2><button ref={closeFilter} className={`${styles.iconButton} ${styles.sidebarClose}`} onClick={() => { setFiltersOpen(false); filterToggle.current?.focus() }} aria-label="Close filters"><X size={18} /></button></div>
                <DiscoveryFilters expanded onApply={() => { clearPropertyCache(); load(1); setFiltersOpen(false) }} />
                <SavedSearches />
                <PartnerHandshake onOpen={() => setFiltersOpen(false)} />
                <p className={styles.sidebarNote}><LockKeyhole size={13} />Your shortlist and saved searches stay on this device.</p>
            </aside>
            <section id="listing-results" className={styles.results} aria-busy={loading}>
                <header className={styles.resultsHeader}><div><p className={styles.eyebrow}>PROPERTY DISCOVERY</p><h2>Explore projects and listings</h2><p role="status">{loading ? "Loading property records…" : error ? "Inventory temporarily unavailable" : `${properties.length} results on page ${page}`}</p></div>
                    <div className={styles.resultActions}><label><span className="sr-only">Sort properties</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="latest">Recently added</option><option value="ai">Smart Ranked</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label><button className={styles.iconButton} aria-pressed={view === "list"} aria-label="Property grid" onClick={() => setView("list")}><LayoutGrid size={16} />{view === "list" && <Check size={12} aria-hidden="true" />}</button><button className={styles.iconButton} aria-pressed={view === "map"} aria-label="Map view" onClick={() => setView("map")}><Map size={16} />{view === "map" && <Check size={12} aria-hidden="true" />}</button></div>
                </header>
                {activeFilters.length > 0 && <div className={styles.chips} aria-label="Active filters">{activeFilters.map(([key,value]) => <button className="inline-flex items-center gap-2" key={key} onClick={() => removeFilter(key)} aria-label={`Remove ${key} filter: ${value.slice(0,120)}`}>{key}: {value.slice(0,120)}<X size={11} /></button>)}<button onClick={reset}>Clear all</button></div>}
                <div className={styles.rankingLine}><Sparkles size={14} /><button onClick={() => showInfo("ranking")}>Understand the signals. Inspect record coverage and stored ranking details.<Info size={13} /></button></div>
                {loading && <div className={styles.grid} aria-hidden="true">{Array.from({length:6},(_,index) => <div key={index} className={styles.skeleton} />)}</div>}
                {error && <div className={styles.empty} role="alert"><h3>We could not load the inventory</h3><p>{error}</p><button className={`gth-btn gth-btn-gold ${styles.button}`} onClick={() => load(page)}>Retry</button></div>}
                {!loading && !error && properties.length === 0 && <div className={styles.empty}><h3>{page > 1 ? "You have reached the end of these results" : "No results match this search"}</h3><p>Try a broader location or remove a filter. Inventory reflects the records currently available.</p><button className={`gth-btn ${styles.button}`} onClick={reset}>Clear search and filters</button></div>}
                {!loading && !error && view === "map" && <div className={styles.empty}><p>{coordinates.length} results on this page have stored coordinates. Map pins are not location verification.</p>{coordinates.length ? <div className="h-[450px] rounded-xl overflow-hidden"><MapWrapper data={coordinates} /></div> : <p>No mapped listings on this page. Switch to the grid to explore the available records.</p>}</div>}
                {!loading && !error && view === "list" && <div className={styles.grid}>{properties.map(property => <ExplorerCard key={property.id} property={property} selected={compared.some(item => item.slug === property.slug)} compareFull={compared.length >= 3} onCompare={() => setCompared(previous => compareSelection(previous, property))} onInfo={kind => showInfo(kind, property)} />)}</div>}
                <nav aria-label="Property result pages" className={styles.pagination}><button disabled={loading || page === 1} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page}</span><button disabled={loading || Boolean(error) || properties.length < PAGE_SIZE} onClick={() => changePage(page + 1)}>Next</button></nav>
                <section className={styles.researchTip}><Compass size={25} /><div><h3>A good decision starts with good questions.</h3><p>Compare the recorded details, check the official registration and request current availability before your next step.</p><Link href="/real-estate/tools" className="text-xs underline">Explore property tools ↗</Link></div></section>
            </section>
        </div>
        <div className={styles.support}><GlobalMarkets /><TrustStandard /></div>
        <section className={styles.submit}><div><h2>Have a property to share?</h2><p>Submit accurate details for review before publication.</p></div><Link href="/real-estate/post-property" className={`gth-btn gth-btn-gold ${styles.button}`}>Submit your listing<ArrowUpRight size={15} /></Link></section>
        {compared.length > 0 && <section className={styles.compareTray} aria-label="Selected property comparison"><strong><GitCompareArrows size={17} />{compared.length} selected</strong><div className={styles.compareNames}>{compared.map(property => <button key={property.slug} onClick={() => setCompared(previous => previous.filter(item => item.slug !== property.slug))} aria-label={`Remove ${property.title} from comparison`}><span>{property.title}</span><X size={12} /></button>)}</div><button className={styles.compareClear} onClick={() => setCompared([])}>Clear</button><button className={`gth-btn gth-btn-gold ${styles.button}`} disabled={compared.length < 2} onClick={() => setDialog({ kind:"compare", properties:compared })}>Compare<ArrowUpRight size={14} /></button></section>}
        {dialog && <ExplorerDialog state={dialog} onClose={() => setDialog(null)} />}
        <BottomNav user={user} />
    </main>
}
