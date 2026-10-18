// ============================================================================
// 🌍 GTH PRO — HOTELS GLOBAL 2026
// 🏆 WORLD-CLASS MOBILE-FIRST + PREMIUM DESKTOP EXPERIENCE
// ✅ MOBILE UI PRESERVED
// ✅ DESKTOP RESTORED + UPGRADED
// ✅ LEFT SIDEBAR INTERNATIONAL BOOKING STYLE
// ✅ REAL ESTATE TAB RETURNED
// ✅ HORIZONTAL CATEGORY SYSTEM
// ✅ NO BROKEN OVERFLOW
// ✅ ECOSYSTEM TOKENS ONLY
// ============================================================================

"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import HotelCatalogPulse from "@/components/hotel/HotelCatalogPulse";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {hotelSearchParams} from "@/lib/travel/hotel-search-params";
import {hotelProviderSearchUrl} from "@/lib/travel/hotel-provider-search";

import {
    Search,
    MapPin,
    CalendarDays,
    Users,
    Star,
    Plane,
    Hotel,
    Car,
    Building2,
    Sparkles,
    ShieldCheck,
    Wifi,
    Waves,
    Dumbbell,
    Coffee,
    ChevronRight,
    Globe2,
    Crown,
    TrendingUp,
    Brain,
    Clock3,
    Diamond,
    Radar,
    Orbit,
    Filter,
    BedDouble,
    Bath,
    Utensils,
    Mountain,
    Trees,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ============================================================================
// DATA ENGINE
// ============================================================================

type HotelListing = {
    id: string | number;
    name: string;
    city: string;
    image: string;
    stars: number | null;
    affiliate_link: string | null;
    category?: string;
    country?: string | null;
    source?: string;
    source_url?: string | null;
    hotel_website?: string | null;
    location_scope?: string;
    image_attribution?: {author:string;license:string;license_url:string;commons_page:string}|null;

};

// Only results returned by the hotel's public listing API are displayed here.

// ============================================================================
// PAGE
// ============================================================================

function HotelsContent() {
    const params = useSearchParams();

    const initialDestination = (params.get("destination")||"").trim().slice(0,80);
    const initialName = (params.get("name") || "").trim().slice(0, 80);
    const initialCity = params.get("city")?.trim() || (initialDestination ? initialDestination.replaceAll("-", " ") : "");
    const [search, setSearch] = useState(initialCity);
    const [requestedCity, setRequestedCity] = useState(initialCity);
    const [nameFilter, setNameFilter] = useState(initialName);
    const [searchName, setSearchName] = useState(initialName);
    const [sort, setSort] = useState<"name_asc"|"name_desc">("name_asc");
    const [sourceFilter, setSourceFilter] = useState<"all"|"partner"|"directory">("all");
    const [requestedDestination,setRequestedDestination]=useState(initialDestination);
    const [selectedCountry,setSelectedCountry]=useState((params.get("country")||"").toUpperCase().slice(0,2));
    const [requestedCountry,setRequestedCountry]=useState((params.get("country")||"").toUpperCase().slice(0,2));
    const [category,setCategory]=useState("");
    const [checkin,setCheckin]=useState("");
    const [checkout,setCheckout]=useState("");
    const [guests,setGuests]=useState(2);
    const [dateError,setDateError]=useState("");
    const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
    useEffect(()=>{
        if(!mobileFiltersOpen)return;
        const dismiss=(event:KeyboardEvent)=>{if(event.key==="Escape")setMobileFiltersOpen(false);};
        window.addEventListener("keydown",dismiss);
        return ()=>window.removeEventListener("keydown",dismiss);
    },[mobileFiltersOpen]);
    const stayParams=new URLSearchParams();
    if(checkin&&checkout){stayParams.set("checkin",checkin);stayParams.set("checkout",checkout);}
    if(Number.isSafeInteger(guests)&&guests>=1&&guests<=20)stayParams.set("adults",String(guests));
    const staySuffix=stayParams.size?"?"+stayParams.toString():"";
    const [hotels, setHotels] = useState<HotelListing[]>([]);
    const [total, setTotal] = useState(0);
    const queryKey = JSON.stringify([requestedDestination,requestedCity,nameFilter,requestedCountry,category,sort,sourceFilter]);
    const activeQueryRef = useRef(queryKey);
    // Every API page MUST carry the identical search scope and filters.
    const hotelParamsFor = (pageNumber: number) => hotelSearchParams({
        destination:requestedDestination,city:requestedCity,name:nameFilter,
        country:requestedCountry,category,sort,source:sourceFilter
    },pageNumber);
    const selectedType = (({
        hotel:"Hotels",hostel:"Hostels",guest_house:"Guest houses",
        motel:"Motels",apartment:"Apartments",resort:"Resorts"
    } as Record<string,string>)[category] ?? "Accommodations");

    const [retryCount,setRetryCount]=useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setSearch(initialCity);
        setRequestedCity(initialCity);
        setNameFilter(initialName);
        setSearchName(initialName);
        setRequestedDestination(initialDestination);
    }, [initialCity, initialName,initialDestination]);

    useEffect(() => {
        const controller = new AbortController();
        setHotels([]);
        activeQueryRef.current = queryKey;
        setTotal(0);
        setLoadingMore(false);
        setLoading(true);
        setError("");

        setPage(1);
        setHasMore(false);

        async function loadHotels() {
            try {
                const hotelParams = hotelParamsFor(1);
                const response = await fetch(`/api/hotels?${hotelParams}`, {
                    cache: "no-store",
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Hotel listings unavailable");
                const data: unknown = await response.json();
                if (!Array.isArray(data)) throw new Error("Unexpected hotel response");
                if (!controller.signal.aborted) {
                    const apiTotal = Number(response.headers.get("X-GTH-Total"));
                    setHotels(data as HotelListing[]);
                    setTotal(Number.isSafeInteger(apiTotal) && apiTotal >= 0 ? apiTotal : data.length);
                    setHasMore(response.headers.get("X-GTH-Has-More") === "true");
                }
            } catch {
                if (!controller.signal.aborted) setError("Hotel search is currently unavailable. Please try again later.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void loadHotels();
        return () => controller.abort();
    // Query key uniquely identifies a filter combination; it resets paging on every change.
    }, [queryKey,retryCount]);

    async function loadMoreHotels() {
        if (loadingMore || loading || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const startedFor = queryKey;
        try {
            const hotelParams = hotelParamsFor(nextPage);
            const response = await fetch(`/api/hotels?${hotelParams}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Hotel page unavailable");
            const incoming: unknown = await response.json();
            if (!Array.isArray(incoming)) throw new Error("Unexpected hotel response");
            if (activeQueryRef.current !== startedFor) return;
            setHotels(existing => {
                const byId = new Map(existing.map(item => [String(item.id),item]));
                for (const item of incoming as HotelListing[]) byId.set(String(item.id),item);
                return [...byId.values()];
            });
            setPage(nextPage);
            setHasMore(response.headers.get("X-GTH-Has-More") === "true" && incoming.length > 0);
            setError("");
        } catch {
            if(activeQueryRef.current === startedFor)setError("More hotel listings could not be loaded. Please retry.");
        } finally {
            if(activeQueryRef.current === startedFor)setLoadingMore(false);
        }
    }

    const runSearch = () => {
        setDateError("");
        const city=search.trim();
        const hotelName=searchName.trim();
        if(city && (city.length<2||city.length>80||
          !/^[\p{L}\p{M}\s.'-]+$/u.test(city))){
            setDateError("Enter a valid city or destination (2–80 letters).");
            return;
        }
        if(hotelName && (hotelName.length<2||hotelName.length>80||
          !/^[\p{L}\p{M}\p{N}\s.'&-]+$/u.test(hotelName))){
            setDateError("Enter a valid hotel name (2–80 characters).");
            return;
        }
        if(selectedCountry && !/^[A-Z]{2}$/.test(selectedCountry)){
            setDateError("Choose a valid country.");
            return;
        }
        if(Boolean(checkin)!==Boolean(checkout)){
            setDateError("Choose both check-in and check-out dates, or leave both empty.");
            return;
        }
        if(checkin){
            const from=new Date(checkin+"T00:00:00Z");
            const to=new Date(checkout+"T00:00:00Z");
            const nights=(to.getTime()-from.getTime())/86400000;
            if(!Number.isFinite(nights)||!Number.isFinite(from.getTime())||
               from.toISOString().slice(0,10)!==checkin ||
               !Number.isFinite(to.getTime())||to.toISOString().slice(0,10)!==checkout||
               checkin<new Date().toISOString().slice(0,10)||nights<1||nights>90){
                setDateError("Choose valid future dates for a stay of 1–90 nights.");
                return;
            }
        }
        if(!Number.isSafeInteger(guests)||guests<1||guests>20){
            setDateError("Choose 1–20 adult guests.");
            return;
        }
        setNameFilter(hotelName);
        setCategory("");
        setRequestedDestination("");
        setRequestedCity(city);
        setRequestedCountry(selectedCountry);
        document.getElementById("hotel-results")?.scrollIntoView({behavior:"smooth",block:"start"});
    };

    const exploreIndia = (city = "") => {
        setSearch(city);
        setSearchName("");
        setNameFilter("");
        setCategory("");
        setRequestedDestination("");
        setRequestedCity(city);
        setSelectedCountry("IN");
        setRequestedCountry("IN");
        document.getElementById("hotel-results")?.scrollIntoView({behavior:"smooth",block:"start"});
    };

    const featuredDestinations = [
      {city:"Mumbai",slug:"mumbai",image:"/images/cities/mumbai.jpg"},
      {city:"Goa",slug:"goa",image:"/images/cities/goa.jpg"},
      {city:"Dubai",slug:"dubai",image:"/images/cities/dubai.jpg"},
      {city:"London",slug:"london",image:"/images/cities/london.jpg"},
      {city:"Singapore",slug:"singapore",image:"/images/cities/singapore.jpg"},
      {city:"Tokyo",slug:"tokyo",image:"/images/cities/tokyo.jpg"},
    ] as const;

    const categories = [
        { icon: Hotel, label: "Hotels", href: "/hotels", active: true },
        { icon: Plane, label: "Flights", href: "/flights", active: false },
        { icon: Mountain, label: "Tours & Activities", href: "/tours", active: false },
        { icon: Building2, label: "Real Estate", href: "/real-estate", active: false },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">
            {/* ========================================================================= */}
            {/* HERO */}
            {/* ========================================================================= */}

            <section className="relative gth-glass overflow-hidden border-b border-[var(--border)] bg-[var(--bg)]">

                <div className="relative z-10 max-w-7xl mx-auto px-4 pt-5 pb-7 md:pt-8 md:pb-9">
                    {/* TOP NAV */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((item, index) => (
                            <a href={item.href}
                                key={index}
                                className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-full border transition-all ${item.active
                                    ? "bg-[var(--card)] border-[var(--border)] text-[var(--text)]"
                                    : "border-transparent text-[var(--text-soft)] hover:bg-[var(--card)]"
                                    }`}
                            >
                                <item.icon size={16} />
                                <span className="text-xs font-semibold whitespace-nowrap">
                                    {item.label}
                                </span>
                            </a>
                        ))}
                    </div>

                    {/* TITLE */}
                    <div className="mt-8">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full gth-glass border border-[var(--border)]">
                            <Orbit size={14} />
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-soft)]">
                                GTH GLOBAL STAYS
                            </span>
                        </div>

                        <h1 className="mt-5 text-2xl text-[var(--text)] sm:text-4xl md:text-5xl font-bold leading-tight max-w-4xl">
                            Discover Hotels Around the World
                        </h1>

                        <p className="mt-4 text-sm md:text-base text-[var(--text-soft)] max-w-2xl">
                            Explore available hotel listings worldwide, then confirm
                            prices, room details and availability with the booking partner.
                        </p>
                    </div>

                    {/* SEARCH */}
                    <div className="mt-8 gth-glass border border-[var(--border)] rounded-3xl p-3 md:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3">
                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4 min-w-0">
                                <MapPin
                                    className="text-[var(--text-soft)] shrink-0"
                                    size={20}
                                />

                                <input
                                    aria-label="Hotel city or destination"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && runSearch()
                                    }
                                    placeholder="City, town or neighbourhood (e.g. Candolim)"
                                    className="bg-transparent outline-none text-sm w-full min-w-0"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4">
                                <Search size={18} className="shrink-0 text-[var(--text-soft)]" />
                                <input aria-label="Hotel name" value={searchName} onChange={e=>setSearchName(e.target.value)}
                                    onKeyDown={e=>e.key==="Enter"&&runSearch()} maxLength={80}
                                    placeholder="Hotel name (optional)" className="bg-transparent outline-none text-sm w-full min-w-0" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2 bg-[var(--card)] rounded-2xl px-3 py-3">
                                <CalendarDays className="shrink-0 text-[var(--text-soft)]" size={17} />
                                <label htmlFor="hotel-checkin" className="min-w-0 flex-1 text-xs font-semibold text-[var(--text-soft)]">Check-in
                                    <input id="hotel-checkin" aria-label="Hotel check-in" type="date" value={checkin} 
                                        onChange={e=>setCheckin(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent text-sm text-[var(--text)]" />
                                </label>
                            </div>
                            <div className="flex min-w-0 items-center gap-2 bg-[var(--card)] rounded-2xl px-3 py-3">
                                <CalendarDays className="shrink-0 text-[var(--text-soft)]" size={17} />
                                <label htmlFor="hotel-checkout" className="min-w-0 flex-1 text-xs font-semibold text-[var(--text-soft)]">Check-out
                                    <input id="hotel-checkout" aria-label="Hotel check-out" type="date" value={checkout} min={checkin||undefined}
                                        onChange={e=>setCheckout(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent text-sm text-[var(--text)]" />
                                </label>
                            </div>
                            <div className="flex min-w-0 items-center gap-2 bg-[var(--card)] rounded-2xl px-3 py-3">
                                <Users className="shrink-0 text-[var(--text-soft)]" size={17} />
                                <label htmlFor="hotel-guests" className="min-w-0 flex-1 text-xs font-semibold text-[var(--text-soft)]">Adult guests
                                    <input id="hotel-guests" aria-label="Hotel adult guests" type="number" value={guests} min={1} max={20} step={1}
                                        onChange={e=>setGuests(e.target.valueAsNumber)} className="mt-1 block w-full min-w-0 bg-transparent text-sm text-[var(--text)]" />
                                </label>
                            </div>

                            <button
                                onClick={runSearch}
                                className="gth-btn-gold rounded-2xl px-6 py-4 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                Search
                            </button>
                        </div>
                        {dateError&&<p role="alert" className="mt-3 text-sm text-[var(--text)]">{dateError}</p>}
                        <p className="mt-2 text-xs text-[var(--text-soft)]">Dates and guests are planning inputs; the provider confirms real prices and availability.</p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
                  <span className="font-semibold">Country</span>
                  <select aria-label="Country" value={selectedCountry}
                    onChange={e=>setSelectedCountry(e.target.value)}
                    className="min-h-8 bg-transparent text-[var(--text)] outline-none">
                    <option value="">Automatic / worldwide</option>
                    <option value="IN">India</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    {selectedCountry&&!["IN","AE","GB","US"].includes(selectedCountry)&&<option value={selectedCountry}>{selectedCountry}</option>}
                  </select>
                </label>
                <button type="button" onClick={()=>exploreIndia()}
                  className="gth-btn-gold min-h-11 rounded-xl px-5 py-2 text-sm font-semibold">Explore India hotels</button>
                <a href="/hotels/list-your-property"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2 text-sm font-semibold">
                  List your hotel for free
                </a>
              </div>
              <p className="mt-2 text-xs text-[var(--text-soft)]">Country coverage includes OSM regional extracts. A source record is not verified room inventory. For a city search, results may include entries lacking an independently confirmed country tag.</p>
              <nav aria-label="Explore hotel destination guides" className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
                {featuredDestinations.map(place=>
                  <Link key={place.slug} href={"/hotels/"+place.slug}
                    className="group flex w-44 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:w-48">
                    <span className="relative block h-24 w-full overflow-hidden">
                      <Image src={place.image} alt={place.city+" destination scenery"} fill sizes="(max-width: 640px) 176px, 192px"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"/>
                    </span>
                    <span className="flex min-h-12 items-center justify-between gap-2 px-3 text-sm font-semibold">
                      Hotels in {place.city}<ChevronRight size={15} aria-hidden="true"/>
                    </span>
                  </Link>
                )}
              </nav>
              <p className="text-xs text-[var(--text-soft)]">
                Destination photographs illustrate the cities, not any individual hotel. Property photos are displayed only from the listing source.
              </p>
            </section>
            <HotelCatalogPulse country={requestedCountry} category={category} onCategory={next=>{
                activeQueryRef.current = "";
                setLoadingMore(false);
                setCategory(next);
                document.getElementById("hotel-results")?.scrollIntoView({behavior:"smooth",block:"start"});
            }}/>

            {nameFilter && (
                <div role="status" className="mx-auto mt-5 max-w-7xl px-5 text-sm font-semibold text-[var(--text)]">
                    Matching hotel names: <span className="gold-text">{nameFilter}</span>
                    <span className="ml-2 text-[var(--text-soft)]">— source listings only; booking availability depends on partners.</span>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MAIN GRID */}
            {/* ========================================================================= */}

            <section className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
                    {/* ========================================================================= */}
                    {/* LEFT DESKTOP SIDEBAR */}
                    {/* ========================================================================= */}

                    {mobileFiltersOpen&&<button type="button" aria-label="Close hotel filter overlay"
                      className="fixed inset-0 z-40 bg-[var(--bg)] opacity-90 lg:hidden"
                      onClick={()=>setMobileFiltersOpen(false)}/>}
                    <aside id="hotel-filter-panel" aria-label="Hotel listing filters"
                      className={mobileFiltersOpen
                        ?"fixed inset-y-0 left-0 z-50 w-[min(90vw,350px)] overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] p-3 shadow-2xl lg:static lg:block lg:w-auto lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                        :"hidden lg:block"}>
                        <div className="space-y-5 lg:sticky lg:top-24">
                            <button type="button" onClick={()=>setMobileFiltersOpen(false)}
                              className="mb-2 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold lg:hidden">
                              Close filters
                            </button>
                            {/* FILTERS */}
                            <div className="gth-glass border border-[var(--border)] rounded-3xl p-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <Filter size={18} />
                                    <h3 className="font-bold text-lg">
                                        Hotel Filters
                                    </h3>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                      <p className="text-xs font-semibold text-[var(--text-soft)]">Real property categories</p>
                                      <p className="mt-2 text-sm text-[var(--text-soft)]">Select source-attributed accommodation types above. Unverified hotel star ratings are intentionally not presented as filters.</p>
                                    </div>
                                    <fieldset className="space-y-2">
                                      <legend className="mb-3 text-sm font-semibold">Accommodation categories</legend>
                                      {[
                                        ["","All accommodations"],
                                        ["hotel","Hotels"],
                                        ["resort","Resorts"],
                                        ["guest_house","Guest houses"],
                                        ["apartment","Apartments"],
                                        ["hostel","Hostels"],
                                        ["motel","Motels"]
                                      ].map(([value,label])=>
                                        <label key={value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm">
                                          <input type="radio" name="hotel-accommodation-category" checked={category===value}
                                            onChange={()=>{setCategory(value);setMobileFiltersOpen(false);}} className="accent-[var(--primary)]"/>
                                          <span>{label}</span>
                                        </label>
                                      )}
                                    </fieldset>
                                    <p className="text-xs text-[var(--text-soft)]">Categories use actual public source classifications; price, ratings, amenities and availability are not assumed.</p>
                                    {/* FEATURES */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] mb-3">
                                            Before you book
                                        </p>

                                        <div className="space-y-2">
                                            {[
                                                {
                                                    icon: Wifi,
                                                    label: "Confirm Wi-Fi access",
                                                },
                                                {
                                                    icon: Waves,
                                                    label: "Check pool availability",
                                                },
                                                {
                                                    icon: Dumbbell,
                                                    label: "Ask about gym facilities",
                                                },
                                                {
                                                    icon: Coffee,
                                                    label: "Confirm meal inclusions",
                                                },
                                                {
                                                    icon: ShieldCheck,
                                                    label: "Check safety and policies",
                                                },
                                            ].map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--card)]"
                                                >
                                                    <item.icon size={16} />
                                                    <span className="text-sm">
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
                                            General planning checklist only. These features are not verified amenities of any specific hotel.
                                        </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI CARD */}
                            <div className="gth-glass border border-[var(--border)] rounded-3xl p-5">
                                <div className="flex items-center gap-2">
                                    <Brain size={18} />
                                    <span className="text-sm font-bold">
                                        GTH PRO Hotel Explorer
                                    </span>
                                </div>

                                <h4 className="mt-4 text-xl font-black leading-tight">
                                    Independent stay discovery
                                </h4>

                                <div className="mt-4 flex items-center gap-2 text-emerald-400">
                                    <TrendingUp size={16} />
                                    <span className="text-sm">
                                        Source-backed hotel profiles, not invented room inventory
                                    </span>
                                </div>

                                <p className="mt-5 text-xs text-[var(--text-soft)]">
                                    Explore each GTH PRO property detail first. Confirm availability, taxes and policies only with the hotel or an authorized booking provider.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* ========================================================================= */}
                    {/* RIGHT CONTENT */}
                    {/* ========================================================================= */}

                    <main id="hotel-results" className="min-w-0 scroll-mt-24">
                        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                            <button type="button" aria-controls="hotel-filter-panel" aria-expanded={mobileFiltersOpen}
                              onClick={()=>setMobileFiltersOpen(true)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">
                              <Filter size={16} aria-hidden="true"/> Filter hotels
                              {category&&<span className="text-xs text-[var(--text-soft)]">· {(category||"").replaceAll("_"," ")}</span>}
                            </button>
                            <span className="text-xs text-[var(--text-soft)]">Source-backed listings</span>
                        </div>
                        <section aria-label="Worldwide live hotel booking search" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                            <div className="max-w-xl">
                                <h2 className="text-base font-semibold">Need real room prices, photos and availability?</h2>
                                <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Our OSM directory shows independently sourced hotel locations, not live room inventory. Search worldwide with an external booking provider and choose your actual dates and guests there.</p>
                            </div>
                            <a href={hotelProviderSearchUrl(requestedCity||search,{checkin,checkout,adults:guests})} target="_blank" rel="noopener noreferrer nofollow"
                               className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
                                Search available hotels on Booking.com <ChevronRight size={16}/>
                            </a>
                        </section>
                        {/* TOP STATS */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black">
                                    {loading ? "Searching…" : total.toLocaleString()+" "+selectedType+" matching"}
                                    
                                </h2>

                                <p className="text-sm text-[var(--text-soft)] mt-1">
                                    Showing {hotels.length.toLocaleString()} of {total.toLocaleString()} · {requestedDestination || requestedCity || requestedCountry || "Worldwide"} · Page {page}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
                                <Radar size={16} />
                                <span className="text-xs">
                                    Up to 24 genuine records per page
                                </span>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                            <label className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">Sort</span>
                              <select aria-label="Sort hotel listings" value={sort}
                                onChange={e=>setSort(e.target.value as "name_asc"|"name_desc")}
                                className="min-h-9 bg-transparent text-[var(--text)]">
                                <option value="name_asc">Hotel name A–Z</option>
                                <option value="name_desc">Hotel name Z–A</option>
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">Listing source</span>
                              <select aria-label="Hotel source" value={sourceFilter}
                                onChange={e=>setSourceFilter(e.target.value as "all"|"partner"|"directory")}
                                className="min-h-9 bg-transparent text-[var(--text)]">
                                <option value="all">All public listings</option>
                                <option value="partner">Approved booking partners</option>
                                <option value="directory">OSM hotel directory</option>
                              </select>
                            </label>
                            <span className="text-xs text-[var(--text-soft)]">Real source records · Prices, reviews and availability require supplier verification</span>
                        </div>
                        <p className="mb-4 text-xs leading-6 text-[var(--text-soft)]">Original hotel photos are shown when supported by the property source. Missing images have an explicit neutral state; unrelated stock photos are not used.</p>
                        {/* HOTEL CARDS */}
                        {loading && <p role="status" className="gth-glass rounded-2xl p-6">Loading hotel listings...</p>}
                        {error && <div role="alert" className="gth-glass rounded-2xl border border-[var(--border)] p-6">
                            <p className="text-sm">{error}</p>
                            <button type="button" onClick={()=>setRetryCount(n=>n+1)}
                              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">
                              Retry hotel search
                            </button>
                          </div>}
                        {!loading && !error && hotels.length === 0 && (
                            <p role="status" className="gth-glass rounded-2xl p-6">No matching hotel listings found. Try another destination or clear property type.</p>
                        )}
                        <div className="space-y-4" aria-label="Hotel listing results">
                            {hotels.map((hotel) => (
                                <article key={hotel.id}
                                  className="group gth-glass overflow-hidden rounded-2xl border border-[var(--border)] transition-shadow hover:shadow-lg">
                                    <div className="flex min-w-0 flex-col md:flex-row">
                                        <div className="relative h-44 w-full shrink-0 bg-[var(--bg-soft)] md:h-auto md:w-52 xl:w-56 2xl:w-60">
                                            <HotelPropertyImage src={hotel.image} name={hotel.name}
                                              className="h-full min-h-44 w-full object-cover md:min-h-52"
                                              placeholderClassName="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 text-center text-[var(--text-soft)] md:min-h-52"/>
                                            {hotel.image_attribution&&<div className="absolute bottom-2 left-2 right-2 rounded-lg bg-[var(--card)] px-2 py-1 text-[10px] leading-4">
                                                <a href={hotel.image_attribution.commons_page} target="_blank" rel="noopener noreferrer nofollow" className="underline">{hotel.image_attribution.author} · Wikimedia Commons</a>
                                                {" · "}<a href={hotel.image_attribution.license_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{hotel.image_attribution.license}</a>
                                            </div>}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:gap-4">
                                            <div className="min-w-0 flex-1">
                                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[11px] font-semibold capitalize">
                                                    {(hotel.category||"hotel").replaceAll("_"," ")}
                                                </span>
                                                <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-[var(--text)] md:text-xl">{hotel.name}</h3>
                                                <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-soft)]">
                                                    <MapPin size={14} className="shrink-0" aria-hidden="true"/>
                                                    <span className="min-w-0 line-clamp-1">{hotel.city}{hotel.country?", "+hotel.country:""}</span>
                                                </p>
                                                <p className="mt-2 text-xs text-[var(--text-soft)]">
                                                    {hotel.source||"Property directory"} · {hotel.affiliate_link ? "Partner handoff available" : "Directory listing"}
                                                </p>
                                                <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">Rates, room availability, star grade and reviews are not independently verified.</p>
                                            </div>
                                            <div className="flex w-full shrink-0 flex-col justify-end gap-2 border-t border-[var(--border)] pt-3 xl:w-48 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
                                                <span className="text-xs font-semibold text-[var(--text-soft)]">Price on provider</span>
                                                <a href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))+staySuffix}
                                                  className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
                                                    View hotel details <ChevronRight size={15} aria-hidden="true"/>
                                                </a>
                                                {hotel.affiliate_link ? <a href={hotel.affiliate_link} target="_blank" rel="noopener noreferrer sponsored"
                                                   className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-center text-xs font-semibold">
                                                    Continue to booking partner
                                                </a> : <a href={hotelProviderSearchUrl([hotel.name,hotel.city,hotel.country].filter(Boolean).join(", "),{checkin,checkout,adults:guests})}
                                                   target="_blank" rel="noopener noreferrer nofollow"
                                                   className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-center text-xs font-semibold">
                                                    Search on Booking.com
                                                </a>}
                                                {!hotel.affiliate_link&&<p className="text-[11px] leading-4 text-[var(--text-soft)]">External name search only; verify exact property.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {hasMore && !loading && (
                            <button type="button" disabled={loadingMore} onClick={() => void loadMoreHotels()}
                                className="gth-btn-gold mt-6 rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-60">
                                {loadingMore ? "Loading next page…" : "Load next "+selectedType.toLowerCase()+" · "+hotels.length.toLocaleString()+" of "+total.toLocaleString()}
                            </button>
                        )}
                    </main>
                </div>
            </section>
        </div>
    );
}

// ============================================================================
// WRAPPER
// ============================================================================

export default function HotelsPage() {
    return (
        <Suspense
            fallback={
                // Searchable, source-honest initial HTML while the client-side
                // hotel catalog hydrates. No fake hotel cards, prices or reviews.
                <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
                    <section className="border-b border-[var(--border)] bg-[var(--card)]">
                        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                                GTH PRO · Global stays
                            </p>
                            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                                Discover Hotels Around the World
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
                                Find source-attributed stays by destination. Verify room availability,
                                taxes, cancellation rules and final prices with the booking partner.
                            </p>
                            <form action="/hotels" method="GET" role="search"
                                className="mt-7 flex max-w-3xl flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 sm:flex-row sm:items-end">
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="hotel-first-render-city" className="mb-2 block text-xs font-semibold">
                                        City or destination
                                    </label>
                                    <input id="hotel-first-render-city" name="city" maxLength={80}
                                        placeholder="e.g. Mumbai, Dubai, London"
                                        className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]" />
                                </div>
                                <button type="submit"
                                    className="gth-btn-gold inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
                                    Find hotels
                                </button>
                            </form>
                        </div>
                    </section>
                    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Hotel catalog loading">
                        <p role="status" className="text-sm text-[var(--text-soft)]">
                            Preparing available hotel listings…
                        </p>
                        <div aria-hidden="true" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2].map((item) => (
                                <div key={item} className="h-40 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
                            ))}
                        </div>
                    </section>
                </main>
            }
        >
            <HotelsContent />
        </Suspense>
    );
}