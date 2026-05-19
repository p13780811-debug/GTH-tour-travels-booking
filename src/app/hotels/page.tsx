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

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

const cities = [
    "Mumbai",
    "Dubai",
    "London",
    "Singapore",
    "Tokyo",
    "New York",
    "Paris",
    "Goa",
    "Maldives",
    "Bangkok",
    "Barcelona",
    "Amsterdam",
    "Sydney",
    "Bali",
    "Rome",
    "Zurich",
    "Seoul",
    "Istanbul",
];

const prefixes = [
    "Royal",
    "Imperial",
    "Velvet",
    "Aurora",
    "Majestic",
    "Elite",
    "Zenith",
    "Grand",
    "Skyline",
    "Regency",
];

const types = [
    "Suites",
    "Resort",
    "Palace",
    "Retreat",
    "Collection",
    "Club",
    "Skyhotel",
];

const pexelsIds = [
    338504,
    261102,
    189296,
    271624,
    2034335,
    258154,
    1134176,
    1838554,
    3201763,
    3771110,
    5379213,
];

const generateHotels = () => {
    return Array.from({ length: 3000 }, (_, i) => {
        const city = cities[i % cities.length];

        return {
            id: i + 1,
            name: `${prefixes[i % prefixes.length]} ${city} ${types[i % types.length]
                }`,
            city,
            image: `https://images.pexels.com/photos/${pexelsIds[i % pexelsIds.length]
                }/pexels-photo-${pexelsIds[i % pexelsIds.length]
                }.jpeg?auto=compress&cs=tinysrgb&w=1200`,
            price: Math.floor(Math.random() * 40000) + 8000,
            rating: (Math.random() * 1.5 + 8.2).toFixed(1),
            reviews: Math.floor(Math.random() * 4000) + 200,
        };
    });
};

// ============================================================================
// PAGE
// ============================================================================

function HotelsContent() {
    const params = useSearchParams();

    const initialCity = params.get("city") || "";

    const [search, setSearch] = useState(initialCity);
    const [hotels, setHotels] = useState<any[]>([]);
    const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
    const [selectedStars, setSelectedStars] = useState<number[]>([]);

    useEffect(() => {
        const data = generateHotels();

        setHotels(data);

        if (initialCity) {
            const filtered = data.filter((h) =>
                h.city.toLowerCase().includes(initialCity.toLowerCase())
            );

            setFilteredHotels(filtered);
        } else {
            setFilteredHotels(data);
        }
    }, [initialCity]);

    const applyFilters = (
        currentSearch = search,
        currentStars = selectedStars
    ) => {
        let results = hotels;

        if (currentSearch) {
            results = results.filter(
                (h) =>
                    h.city.toLowerCase().includes(currentSearch.toLowerCase()) ||
                    h.name.toLowerCase().includes(currentSearch.toLowerCase())
            );
        }

        if (currentStars.length > 0) {
            results = results.filter((h) =>
                currentStars.includes(Math.floor(Number(h.rating)))
            );
        }

        setFilteredHotels(results);
    };

    const categories = [
        { icon: Hotel, label: "Hotels", active: true },
        { icon: Plane, label: "Flights" },
        { icon: Car, label: "Car Rentals" },
        { icon: Building2, label: "Real Estate" },
        { icon: Mountain, label: "Adventures" },
        { icon: Utensils, label: "Food Tours" },
        { icon: Trees, label: "Nature" },
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
                            <button
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
                            </button>
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
                            Discover Your Perfect Luxury Stay Worldwide
                        </h1>

                        <p className="mt-4 text-sm text-white md:text-lg text-[var(--text-soft)] max-w-2xl">
                            AI-powered hotel discovery engine with real-time pricing,
                            premium stays, real-estate integration and global experiences.
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
                                        e.key === "Enter" && applyFilters()
                                    }
                                    placeholder="Search destination or hotel..."
                                    className="bg-transparent outline-none text-sm w-full min-w-0"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4">
                                <CalendarDays
                                    className="text-[var(--text-soft)]"
                                    size={18}
                                />

                                <span className="text-sm truncate">
                                    Check-in — Check-out
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--card)] rounded-2xl px-4 py-4">
                                <Users
                                    className="text-[var(--text-soft)]"
                                    size={18}
                                />

                                <span className="text-sm truncate">
                                    2 Guests · 1 Room
                                </span>
                            </div>

                            <button
                                onClick={() => applyFilters()}
                                className="gth-btn-gold rounded-2xl px-6 py-4 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

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
                                        Smart Filters
                                    </h3>
                                </div>

                                <div className="space-y-6">
                                    {/* STAR FILTER */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] mb-3">
                                            Star Rating
                                        </p>

                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => {
                                                        let updated = [...selectedStars];

                                                        if (updated.includes(star)) {
                                                            updated = updated.filter(
                                                                (s) => s !== star
                                                            );
                                                        } else {
                                                            updated.push(star);
                                                        }

                                                        setSelectedStars(updated);
                                                        applyFilters(search, updated);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${selectedStars.includes(star)
                                                        ? "border-[var(--border)] bg-[var(--card)]"
                                                        : "border-transparent hover:bg-[var(--card)]"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {Array.from({ length: star }).map(
                                                            (_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    fill="currentColor"
                                                                />
                                                            )
                                                        )}
                                                    </div>

                                                    <span className="text-xs text-[var(--text-soft)]">
                                                        Premium
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* FEATURES */}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] mb-3">
                                            Amenities
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
                                        GTH AI Recommendation
                                    </span>
                                </div>

                                <h4 className="mt-4 text-xl font-black leading-tight">
                                    Best Time To Book Dubai Hotels:
                                </h4>

                                <div className="mt-4 flex items-center gap-2 text-emerald-400">
                                    <TrendingUp size={16} />
                                    <span className="text-sm">
                                        Prices dropping by 18%
                                    </span>
                                </div>

                                <button className="mt-5 w-full gth-btn-gold rounded-2xl py-3 text-sm font-bold">
                                    Activate AI Saver
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* ========================================================================= */}
                    {/* RIGHT CONTENT */}
                    {/* ========================================================================= */}

                    <main className="min-w-0">
                        {/* MOBILE FILTERS */}
                        <div className="xl:hidden flex gap-2 overflow-x-auto no-scrollbar mb-5">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button
                                    key={star}
                                    className="shrink-0 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs"
                                >
                                    {star} Stars
                                </button>
                            ))}
                        </div>

                        {/* TOP STATS */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black">
                                    {filteredHotels.length.toLocaleString()} Premium
                                    Properties
                                </h2>

                                <p className="text-sm text-[var(--text-soft)] mt-1">
                                    AI-ranked luxury inventory across global cities
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
                                <Radar size={16} />
                                <span className="text-xs">
                                    Live Dynamic Pricing
                                </span>
                            </div>
                        </div>

                        {/* HOTEL CARDS */}
                        <div className="space-y-5">
                            {filteredHotels.slice(0, 30).map((hotel) => (
                                <div
                                    key={hotel.id}
                                    className="group gth-glass border border-[var(--border)] rounded-3xl overflow-hidden hover:scale-[1.01] transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row">
                                        {/* IMAGE */}
                                        <div className="relative lg:w-[360px] shrink-0">
                                            <img
                                                src={hotel.image}
                                                alt={hotel.name}
                                                className="w-full h-[240px] lg:h-full object-cover"
                                            />

                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="bg-[var(--card)] rounded-full px-3 py-2 text-[10px] font-bold flex items-center gap-1">
                                                    <Diamond size={12} />
                                                    Luxury
                                                </div>

                                                <div className="bg-[var(--card)] rounded-full px-3 py-2 text-[10px] font-bold flex items-center gap-1">
                                                    <Clock3 size={12} />
                                                    Instant Book
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
                                                            {Array.from({ length: 5 }).map(
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
                                                            Verified Property
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <Globe2 size={14} />
                                                            International Standard
                                                        </div>
                                                    </div>

                                                    {/* FEATURES */}
                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        {[
                                                            "Infinity Pool",
                                                            "Spa",
                                                            "Ocean View",
                                                            "Fine Dining",
                                                            "Smart Rooms",
                                                        ].map((feature) => (
                                                            <div
                                                                key={feature}
                                                                className="px-3 py-2 rounded-full bg-[var(--card)] text-xs border border-[var(--border)]"
                                                            >
                                                                {feature}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* DESCRIPTION */}
                                                    <p className="mt-5 text-sm leading-7 text-[var(--text-soft)] max-w-2xl">
                                                        Experience elite hospitality with
                                                        AI-curated comfort, panoramic luxury
                                                        suites, premium wellness infrastructure
                                                        and world-class international service
                                                        standards.
                                                    </p>
                                                </div>

                                                {/* RIGHT */}
                                                <div className="lg:w-[240px] shrink-0">
                                                    <div className="gth-glass border border-[var(--border)] rounded-3xl p-5 h-full flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="text-3xl font-black">
                                                                        {hotel.rating}
                                                                    </div>

                                                                    <div className="text-xs text-[var(--text-soft)]">
                                                                        Exceptional
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="text-xs text-[var(--text-soft)]">
                                                                        Reviews
                                                                    </div>

                                                                    <div className="font-bold">
                                                                        {hotel.reviews}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-6">
                                                                <div className="text-xs text-[var(--text-soft)]">
                                                                    Starting From
                                                                </div>

                                                                <div className="mt-1 text-4xl font-black">
                                                                    ₹
                                                                    {hotel.price.toLocaleString()}
                                                                </div>

                                                                <div className="text-xs text-[var(--text-soft)] mt-1">
                                                                    Includes taxes & fees
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-6 space-y-3">
                                                            <button className="w-full gth-btn-gold rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2">
                                                                View Availability
                                                                <ChevronRight size={16} />
                                                            </button>

                                                            <button className="w-full gth-btn rounded-2xl py-4 text-sm font-semibold">
                                                                Save Property
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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