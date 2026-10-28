"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { User } from "@supabase/supabase-js"
import { ArrowUpRight, Check, Compass, GitCompareArrows, Heart, Info, LayoutGrid, LockKeyhole, Map, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { clearPropertyCache } from "@/lib/real-estate/propertyService"
import DiscoveryFilters from "@/components/real-estate/DiscoveryFilters"
import SavedSearches from "@/components/real-estate/SavedSearches"
import ExplorerHero from "@/components/real-estate/ExplorerHero"
import ExplorerCard from "@/components/real-estate/ExplorerCard"
import ExplorerDialog, { type ExplorerDialogState } from "@/components/real-estate/ExplorerDialog"
import { compareSelection, type ExplorerProperty } from "@/lib/real-estate/explorer"
import { normalizeSaved, SAVED_KEY } from "@/lib/real-estate/saved"
import GlobalMarkets from "@/components/real-estate/GlobalMarkets"
import PartnerHandshake from "@/components/property/PartnerHandshake"
import HomeLoanCalculator from "@/components/property/HomeLoanCalculator"
import AreaConverter from "@/components/real-estate/AreaConverter"
import { isPropertyVisualCard } from "@/app/real-estate/registry/explorer-presentation"
import TrustStandard from "@/components/real-estate/TrustStandard"
import { parseRegistryFilters } from "@/lib/real-estate/registry-search"
import RegistryDiscovery from "@/components/real-estate/RegistryDiscovery"
import RegistryPhotoProjects from "@/components/real-estate/RegistryPhotoProjects"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Explorer.module.css"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false, loading: () => <p role="status">Loading map…</p> })

export default function RealEstatePage() {
    const [discovery, setDiscovery] = useState<"offers" | "registry">("registry")
    const [registryDraft,setRegistryDraft] = useState("")
    const [registryQuery,setRegistryQuery] = useState("")
    const [registryAttempt,setRegistryAttempt] = useState(0)
    const [registryValidation,setRegistryValidation] = useState("")
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<ExplorerProperty[]>([])
    const [activeFilters, setActiveFilters] = useState<[string, string][]>([])
    const [query, setQuery] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasNext, setHasNext] = useState(false)
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
    const activeDiscovery = useRef(discovery)
    useEffect(() => {activeDiscovery.current = discovery},[discovery])

    const load = useCallback(async (requestedPage?: number) => {
        const current = ++request.current
        const url = new URL(window.location.href)
        const storedPage = Number(url.searchParams.get("page"))
        const nextPage = requestedPage ?? (Number.isInteger(storedPage) && storedPage > 0 && storedPage <= 10000 ? storedPage : 1)
        const params = url.searchParams
        setActiveFilters([...params.entries()].filter(([key,value]) => ["query","country","city","type","listing","bedrooms","currency","minPrice","maxPrice","sort","possession"].includes(key) && Boolean(value)))
        setLoading(true)
        setError("")
        setQuery((params.get("query") || "").slice(0, 120))
        try {
            const search = new URLSearchParams(params)
            search.set("page", String(nextPage))
            const response = await fetch(`/api/real-estate/search?${search}`, {signal: AbortSignal.timeout(12000), cache:"no-store"})
            const result = await response.json()
            if (!response.ok || !Array.isArray(result.items)) throw new Error("Search unavailable")
            if (current !== request.current) return
            setProperties(result.items.filter(isPropertyVisualCard))
            setHasNext(result.hasNext === true)
            setPage(nextPage)
            if (nextPage > 1) url.searchParams.set("page", String(nextPage))
            else url.searchParams.delete("page")
            window.history.replaceState(null, "", url)
        } catch {
            if (current === request.current) { setProperties([]); setHasNext(false); setError("Listings could not be loaded. Please retry.") }
        } finally { if (current === request.current) setLoading(false) }
    }, [])

    useEffect(() => {
        let active = true
        const hasOfferFilters = ["listing","query","city","country","type","bedrooms","minPrice","maxPrice","possession"].some(key => new URLSearchParams(window.location.search).has(key))
        if (hasOfferFilters) {setDiscovery("offers");load()} else setLoading(false)
        supabase.auth.getUser().then(({ data }) => { if (active) setUser(data.user) }).catch(() => { /* Public discovery stays available without a session. */ })
        const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
        const onHistory = () => { setDiscovery("offers"); setFiltersOpen(false); load() }
        window.addEventListener("popstate", onHistory)
        window.addEventListener("gth-search-load", onHistory)
        const refreshInventory = () => { if(activeDiscovery.current === "offers") {clearPropertyCache();load()} }
        const channel = supabase.channel("estate-inventory").on("postgres_changes", { event:"*", schema:"public", table:"properties" }, refreshInventory).on("postgres_changes", { event:"*", schema:"public", table:"property_inventory" }, refreshInventory).on("postgres_changes", { event:"*", schema:"public", table:"property_published_media" }, refreshInventory).subscribe()
        return () => { active = false; request.current += 1; auth.subscription.unsubscribe(); window.removeEventListener("popstate", onHistory); window.removeEventListener("gth-search-load", onHistory); supabase.removeChannel(channel) }
    }, [load])

    useEffect(() => {
        const sync = () => { try { setSavedCount(normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")).length) } catch { setSavedCount(0) } }
        sync(); window.addEventListener("gth-saved", sync); window.addEventListener("storage", sync)
        return () => { window.removeEventListener("gth-saved", sync); window.removeEventListener("storage", sync) }
    }, [])

    // Responsive Real Estate filters preserve the desktop sidebar and open an accessible mobile bottom sheet.
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
        if (discovery === "registry") {
            const parsed = parseRegistryFilters({q:term})
            if (!parsed.ok) {setRegistryValidation(parsed.error);return}
            setRegistryValidation("");setRegistryQuery(parsed.filters.q);setRegistryAttempt(value => value+1)
            return
        }
        const url = new URL(window.location.href)
        if (term.trim()) url.searchParams.set("query", term.trim().slice(0, 120))
        else url.searchParams.delete("query")
        url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        load(1)
        document.getElementById("listing-results")?.scrollIntoView({ block:"start" })
    }
    const applyIntent = (value: string) => {
        if (value === "registry") {setDiscovery("registry");setFiltersOpen(false);return}
        setDiscovery("offers")
        const url = new URL(window.location.href)
        url.searchParams.delete("page")
        url.searchParams.delete("type")
        if (["commercial","plots"].includes(value)) url.searchParams.delete("bedrooms")
        if (value) url.searchParams.set("listing", value)
        else url.searchParams.delete("listing")
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters"))
        load(1)
    }
    const openFilters = () => {
        setDiscovery("offers")
        if (window.innerWidth <= 960) setFiltersOpen(previous => !previous)
        else requestAnimationFrame(() => sidebar.current?.querySelector<HTMLInputElement>("input")?.focus())
    }
    const refine = (values:Record<string,string>) => {
        setDiscovery("offers")
        const url = new URL(window.location.href)
        for (const [key,value] of Object.entries(values)) if (["bedrooms","possession"].includes(key)) {
            if (value) url.searchParams.set(key,value); else url.searchParams.delete(key)
        }
        url.searchParams.delete("page")
        window.history.replaceState(null,"",url)
        window.dispatchEvent(new Event("gth-discovery-filters")); load(1)
    }
    const removeFilter = (key: string) => {
        const url = new URL(window.location.href)
        url.searchParams.delete(key); url.searchParams.delete("page")
        window.history.replaceState(null, "", url)
        window.dispatchEvent(new Event("gth-discovery-filters")); load(1)
    }
    const reset = () => {
        const url = new URL(window.location.href)
        for (const key of ["query","page","country","city","type","listing","bedrooms","currency","minPrice","maxPrice","sort","possession"]) url.searchParams.delete(key)
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
        <div id="property-search" className="scroll-mt-24"><ExplorerHero query={discovery === "registry" ? registryDraft : query} onQuery={discovery === "registry" ? setRegistryDraft : setQuery} onSearch={updateSearch} loading={discovery === "offers" && loading} intent={discovery === "registry" ? "registry" : activeFilters.find(([key]) => key === "listing")?.[1] || "buy"} onIntent={applyIntent} onInfo={showInfo} filters={Object.fromEntries(activeFilters)} onRefine={refine} onFilters={openFilters} /></div>
        <nav className="scrollbar-hide mt-4 flex items-center gap-4 overflow-x-auto border-b pb-2 text-sm" aria-label="Property workspace"><button type="button" className="gth-badge min-h-11 shrink-0 aria-pressed:font-semibold aria-pressed:underline" aria-pressed={discovery === "registry"} onClick={() => {setDiscovery("registry");setFiltersOpen(false)}}>Registered projects</button><button type="button" className="gth-badge min-h-11 shrink-0 aria-pressed:font-semibold aria-pressed:underline" aria-pressed={discovery === "offers"} onClick={() => {setDiscovery("offers");load(1)}}>Sale & rental offers</button><Link className="inline-flex min-h-11 shrink-0 items-center gap-1" href="/real-estate/saved"><Heart size={14}/>Saved {savedCount}</Link><button className="inline-flex min-h-11 shrink-0 items-center gap-1" onClick={() => setDialog({kind:"compare",properties:compared})}><GitCompareArrows size={14}/>Compare {compared.length}</button><a className="inline-flex min-h-11 shrink-0 items-center" href="#buyer-tools">Buyer tools</a></nav>
        {discovery === "registry" && <>{registryValidation && <p role="alert" className="mt-3 text-sm">{registryValidation}</p>}<RegistryDiscovery query={registryQuery} attempt={registryAttempt}/></>}
        <div hidden={discovery !== "offers"}>
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
                <header className={styles.resultsHeader}><div><p className={styles.eyebrow}>PROPERTY DISCOVERY</p><h2>Properties with approved photographs</h2><p role="status">{loading ? "Finding reviewed property listings…" : error ? "Inventory temporarily unavailable" : `${properties.length} results on page ${page}`}</p></div>
                    <div className={styles.resultActions}><label><span className="sr-only">Sort properties</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="latest">Recently added</option><option value="ai">Smart Ranked</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></label><button className={styles.iconButton} aria-pressed={view === "list"} aria-label="Property grid" onClick={() => setView("list")}><LayoutGrid size={16} />{view === "list" && <Check size={12} aria-hidden="true" />}</button><button className={styles.iconButton} aria-pressed={view === "map"} aria-label="Map view" onClick={() => setView("map")}><Map size={16} />{view === "map" && <Check size={12} aria-hidden="true" />}</button></div>
                </header>
                {activeFilters.length > 0 && <div className={styles.chips} aria-label="Active filters">{activeFilters.map(([key,value]) => <button className="inline-flex items-center gap-2" key={key} onClick={() => removeFilter(key)} aria-label={`Remove ${key} filter: ${value.slice(0,120)}`}>{key}: {value.slice(0,120)}<X size={11} /></button>)}<button onClick={reset}>Clear all</button></div>}
                <details className="mb-3 text-xs"><summary>How property ranking works</summary><button className="mt-2 min-h-11" onClick={() => showInfo("ranking")}><Sparkles size={14}/>Inspect record coverage and ranking details<Info size={13}/></button></details>
                {loading && <div className={styles.grid} aria-hidden="true">{Array.from({length:6},(_,index) => <div key={index} className={styles.skeleton} />)}</div>}
                {error && <div className={styles.empty} role="alert"><h3>We could not load the inventory</h3><p>{error}</p><button className={`gth-btn gth-btn-gold ${styles.button}`} onClick={() => load(page)}>Retry</button></div>}
                {!loading && !error && properties.length === 0 && <div className={styles.empty}><h3>{page > 1 ? "You have reached the end of these results" : activeFilters.length === 0 ? "Verified property offers are coming to this marketplace" : "No reviewed property offers match these filters"}</h3><p>Sale and rental offers appear after submission and photo review. Explore registered projects separately or be among the first to list your property.</p><div className="flex flex-wrap gap-3"><Link href={"/real-estate/registry" + ((activeFilters.find(([key]) => key === "city" || key === "query")?.[1]) ? "?q=" + encodeURIComponent((activeFilters.find(([key]) => key === "city" || key === "query")?.[1] || "").slice(0,70)) : "")} className={`gth-btn gth-btn-gold ${styles.button}`}>Research registered projects</Link><Link href="/real-estate/post-property" className={`gth-btn ${styles.button}`}>Submit a property for review</Link>{activeFilters.length > 0 && <button className={`gth-btn ${styles.button}`} onClick={reset}>Clear search filters</button>}</div></div>}
                {!loading && !error && view === "map" && <div className={styles.empty}><p>{coordinates.length} results on this page have stored coordinates. Map pins are not location verification.</p>{coordinates.length ? <div className="h-[450px] rounded-xl overflow-hidden"><MapWrapper data={coordinates} /></div> : <p>No mapped listings on this page. Switch to the grid to explore the available records.</p>}</div>}
                {!loading && !error && view === "list" && <div className={styles.grid}>{properties.map(property => <ExplorerCard key={property.id} property={property} selected={compared.some(item => item.slug === property.slug)} compareFull={compared.length >= 3} onCompare={() => setCompared(previous => compareSelection(previous, property))} onInfo={kind => showInfo(kind, property)} />)}</div>}
                <nav aria-label="Property result pages" className={styles.pagination}><button disabled={loading || page === 1} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page}</span><button disabled={loading || Boolean(error) || !hasNext} onClick={() => changePage(page + 1)}>Next</button></nav>
                <section className={styles.researchTip}><Compass size={25} /><div><h3>A good decision starts with good questions.</h3><p>Compare the recorded details, check the official registration and request current availability before your next step.</p><Link href="/real-estate/tools" className="text-xs underline">Explore property tools ↗</Link></div></section>
            </section>
        </div>
        </div>
        <nav aria-label="Buyer research tools" className="mt-8 flex flex-wrap gap-3"><Link href="/real-estate/registry" className="gth-btn inline-flex min-h-11 items-center">Search & compare registry projects</Link><Link href="/real-estate/saved#research-workspace" className="gth-btn inline-flex min-h-11 items-center">Private buyer workspace</Link><Link href="/real-estate/tools#buyer-planning-studio" className="gth-btn inline-flex min-h-11 items-center">Ownership cost & affordability</Link></nav>
        <RegistryPhotoProjects />
        <section id="buyer-tools" className="mt-10 scroll-mt-24"><p className="gold-text text-xs uppercase tracking-widest">Buyer planning</p><div className="mt-4 grid items-start gap-6 lg:grid-cols-2"><HomeLoanCalculator /><AreaConverter /></div></section>
        <div className={styles.support}><GlobalMarkets /><TrustStandard /></div>
        <section className={styles.submit}><div><h2>Owners, developers & channel partners</h2><p>List a resale home, rental, new launch, commercial space or plot. Add real photographs, specifications and your asking price for independent review.</p><p className="mt-3 text-xs">Create your account → Submit property & rights evidence → Listing and photo review → Publication. Registration is checked separately; a submission is never an automatic verification.</p></div><Link href="/real-estate/post-property" className={`gth-btn gth-btn-gold ${styles.button}`}>List your property<ArrowUpRight size={15} /></Link></section>
        {compared.length > 0 && <section className={styles.compareTray} aria-label="Selected property comparison"><strong><GitCompareArrows size={17} />{compared.length} selected</strong><div className={styles.compareNames}>{compared.map(property => <button key={property.slug} onClick={() => setCompared(previous => previous.filter(item => item.slug !== property.slug))} aria-label={`Remove ${property.title} from comparison`}><span>{property.title}</span><X size={12} /></button>)}</div><button className={styles.compareClear} onClick={() => setCompared([])}>Clear</button><button className={`gth-btn gth-btn-gold ${styles.button}`} disabled={compared.length < 2} onClick={() => setDialog({ kind:"compare", properties:compared })}>Compare<ArrowUpRight size={14} /></button></section>}
        {dialog && <ExplorerDialog state={dialog} onClose={() => setDialog(null)} />}
        <BottomNav user={user} />
    </main>
}
