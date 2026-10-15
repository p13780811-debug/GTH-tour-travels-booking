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
import HotelCatalogPulse from "@/components/hotel/HotelCatalogPulse";
import {hotelSearchParams} from "@/lib/travel/hotel-search-params";

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
    const [requestedDestination,setRequestedDestination]=useState(initialDestination);
    const [selectedCountry,setSelectedCountry]=useState((params.get("country")||"").toUpperCase().slice(0,2));
    const [requestedCountry,setRequestedCountry]=useState((params.get("country")||"").toUpperCase().slice(0,2));
    const [category,setCategory]=useState("");
    const [hotels, setHotels] = useState<HotelListing[]>([]);
    const [total, setTotal] = useState(0);
    const queryKey = JSON.stringify([requestedDestination,requestedCity,nameFilter,requestedCountry,category]);
    const activeQueryRef = useRef(queryKey);
    // Every API page MUST carry the identical search scope and filters.
    const hotelParamsFor = (pageNumber: number) => hotelSearchParams({
        destination:requestedDestination,city:requestedCity,name:nameFilter,
        country:requestedCountry,category
    },pageNumber);
    const selectedType = (({
        hotel:"Hotels",hostel:"Hostels",guest_house:"Guest houses",
        motel:"Motels",apartment:"Apartments",resort:"Resorts"
    } as Record<string,string>)[category] ?? "Accommodations");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setSearch(initialCity);
        setRequestedCity(initialCity);
        setNameFilter(initialName);
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
    }, [queryKey]);

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
        const city=search.trim();
        if(city.length>80 || (city.length>0&&city.length<2))return;
        if(selectedCountry&&!/^[A-Z]{2}$/.test(selectedCountry))return;
        setNameFilter("");
        setCategory("");
        setRequestedDestination("");
        setRequestedCity(city);
        setRequestedCountry(city?"":selectedCountry);
    };

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

            <section className="relative gth-glass overflow-hidden p-6 md:p-10">
                <div className="absolute inset-0 text-white">
                    <img
                        src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1600"
                        className="w-full h-full object-cover"
                        alt=""
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-8 md:pt-28 md:pb-12">
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
                            <span className="text-[10px] text-white tracking-[0.3em] uppercase text-[var(--text-soft)]">
                                GTH GLOBAL STAYS
                            </span>
                        </div>

                        <h1 className="mt-5 text-2xl text-white sm:text-4xl md:text-6xl font-black leading-tight max-w-4xl">
                            Discover Hotels Around the World
                        </h1>

                        <p className="mt-4 text-sm text-white md:text-lg text-[var(--text-soft)] max-w-2xl">
                            Explore available hotel listings worldwide, then confirm
                            prices, room details and availability with the booking partner.
                        </p>
                    </div>

                    {/* SEARCH */}
                    <div className="mt-8 gth-glass border border-[var(--border)] rounded-3xl p-3 md:p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3">
                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4 min-w-0">
                                <MapPin
                                    className="text-[var(--text-soft)] shrink-0"
                                    size={20}
                                />

                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && runSearch()
                                    }
                                    placeholder="City (blank for visitor-country hotels)"
                                    className="bg-transparent outline-none text-sm w-full min-w-0"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4">
                                <CalendarDays
                                    className="text-[var(--text-soft)]"
                                    size={18}
                                />

                                <span className="text-sm truncate">
                                    Choose dates with partner
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4">
                                <Users
                                    className="text-[var(--text-soft)]"
                                    size={18}
                                />

                                <span className="text-sm truncate">
                                    Choose guests with partner
                                </span>
                            </div>

                            <button
                                onClick={runSearch}
                                className="gth-btn-gold rounded-2xl px-6 py-4 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
              <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
                <span className="font-semibold">Country ISO code</span>
                <input aria-label="Country code" maxLength={2} placeholder="Auto"
                  className="w-16 bg-transparent uppercase text-[var(--text)] outline-none"
                  value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value.toUpperCase())}/>
              </label>
              <p className="mt-2 text-xs text-[var(--text-soft)]">Leave city empty and select a country; or search a city worldwide. Country detection is approximate, not GPS.</p>
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
                <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
                    {/* ========================================================================= */}
                    {/* LEFT DESKTOP SIDEBAR */}
                    {/* ========================================================================= */}

                    <aside className="hidden xl:block">
                        <div className="sticky top-24 space-y-5">
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
                                    {/* FEATURES */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] mb-3">
                                            Amenities to confirm
                                        </p>

                                        <div className="space-y-2">
                                            {[
                                                {
                                                    icon: Wifi,
                                                    label: "High-Speed WiFi",
                                                },
                                                {
                                                    icon: Waves,
                                                    label: "Infinity Pool",
                                                },
                                                {
                                                    icon: Dumbbell,
                                                    label: "Fitness Club",
                                                },
                                                {
                                                    icon: Coffee,
                                                    label: "Breakfast Included",
                                                },
                                                {
                                                    icon: ShieldCheck,
                                                    label: "Secure Stay",
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

                        {/* HOTEL CARDS */}
                        {loading && <p role="status" className="gth-glass rounded-2xl p-6">Loading hotel listings...</p>}
                        {error && <p role="alert" className="gth-glass rounded-2xl p-6">{error}</p>}
                        {!loading && !error && hotels.length === 0 && (
                            <p role="status" className="gth-glass rounded-2xl p-6">No matching hotel listings found. Try another destination or clear property type.</p>
                        )}
                        <div className="space-y-5">
                            {hotels.map((hotel) => (
                                <div
                                    key={hotel.id}
                                    className="group gth-glass border border-[var(--border)] rounded-3xl overflow-hidden hover:scale-[1.01] transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row">
                                        {/* IMAGE */}
                                        <div className="relative lg:w-[360px] shrink-0 min-h-[240px]">
                                            {hotel.image && hotel.image !== "/placeholder.jpg" ? (
                                                <img src={hotel.image} alt={"Accommodation photo: "+hotel.name}
                                                    loading="lazy" className="w-full h-[240px] lg:h-full object-cover"/>
                                            ) : (
                                                <div role="img" aria-label={"No licensed property photo for "+hotel.name}
                                                    className="flex h-[240px] flex-col items-center justify-center gap-3 bg-[var(--bg)] px-6 text-center text-[var(--text-soft)]">
                                                    {hotel.category==="apartment" ? <Building2 size={36} aria-hidden="true"/> :
                                                     hotel.category==="guest_house" ? <BedDouble size={36} aria-hidden="true"/> :
                                                     hotel.category==="hostel" ? <Users size={36} aria-hidden="true"/> :
                                                     <Hotel size={36} aria-hidden="true"/>}
                                                    <p className="text-xs font-medium">{(hotel.category||"hotel").replaceAll("_"," ")} · No licensed hotel photo</p>
                                                </div>
                                            )}

                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="bg-[var(--card)] rounded-full px-3 py-2 text-[10px] font-bold flex items-center gap-1">
                                                    <Diamond size={12} />
                                                    {(hotel.category||"hotel").replaceAll("_"," ")}
                                                </div>

                                                <div className="bg-[var(--card)] rounded-full px-3 py-2 text-[10px] font-bold flex items-center gap-1">
                                                    <Clock3 size={12} />
                                                    {hotel.affiliate_link ? "Partner booking available" : "GTH PRO directory" }
                                                </div>
                                            </div>
                                        </div>

                                        {/* CONTENT */}
                                        <div className="flex-1 p-5 md:p-6 min-w-0">
                                            <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                                                {/* LEFT */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-3 flex-wrap">
                                                        <h3 className="text-2xl font-black leading-tight">
                                                            {hotel.name}
                                                        </h3>

                                                        <div className="flex items-center gap-1 text-amber-400">
                                                            {Array.from({ length: hotel.stars ?? 0 }).map(
                                                                (_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={14}
                                                                        fill="currentColor"
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[var(--text-soft)] text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={14} />
                                                            {hotel.city}
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <ShieldCheck size={14} />
                                                            Verify details with source
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <Globe2 size={14} />
                                                            {hotel.source||"Reviewed provider"}
                                                        </div>
                                                    </div>

                                                    <p className="mt-5 text-sm text-[var(--text-soft)]">
                                                        Category: {(hotel.category||"hotel").replaceAll("_"," ")} · Source: {hotel.source||"Property directory"}
                                                    </p>

                                                    {/* DESCRIPTION */}
                                                    <p className="mt-5 text-sm leading-7 text-[var(--text-soft)] max-w-2xl">
                                                        Property details are shown in GTH PRO. Review the original
                                                        source and confirm room types, cancellation terms and
                                                        current availability before reserving.
                                                    </p>
                                                </div>

                                                {/* RIGHT */}
                                                <div className="lg:w-[240px] shrink-0">
                                                    <div className="gth-glass border border-[var(--border)] rounded-3xl p-5 h-full flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="text-3xl font-black">
                                                                        {hotel.stars ?? "—"}
                                                                    </div>

                                                                    <div className="text-xs text-[var(--text-soft)]">
                                                                        Star grade not verified
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="text-xs text-[var(--text-soft)]">
                                                                        Reviews
                                                                    </div>

                                                                    <div className="font-bold">
                                                                        Not available
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-6">
                                                                <div className="text-xs text-[var(--text-soft)]">
                                                                    Price
                                                                </div>

                                                                <div className="mt-1 text-base font-bold">
                                                                    Price not independently verified
                                                                </div>

                                                                <div className="text-xs text-[var(--text-soft)] mt-1">
                                                                    Live prices appear only when an authorized supplier confirms them
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 space-y-3">
                                                            <a href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))}
                                                              className="gth-btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold">
                                                              View hotel details <ChevronRight size={16}/>
                                                            </a>
                                                            {hotel.affiliate_link ? (
                                                                <a
                                                                    href={hotel.affiliate_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer sponsored"
                                                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                                                                >
                                                                    Continue to partner
                                                                    <ChevronRight size={16} />
                                                                </a>
                                                            ) : (
                                                                <p className="text-xs text-[var(--text-soft)]">
                                                                    GTH PRO hotel profile and original property source available. Booking handoff not connected for this record.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
                    <div className="gth-glass border border-[var(--border)] rounded-3xl px-8 py-5">
                        <div className="flex items-center gap-3">
                            <Sparkles className="animate-pulse" size={18} />
                            <span className="text-sm font-bold">
                                Initializing Global Luxury Engine...
                            </span>
                        </div>
                    </div>
                </div>
            }
        >
            <HotelsContent />
        </Suspense>
    );
}