"use client"

import { useState, useEffect } from "react"
import {
    Search,
    MapPin,
    Sparkles,
    SlidersHorizontal,
    Radar,
    Wand2,
    ChevronRight,
} from "lucide-react"

export default function SearchPanel({ setQuery }: any) {
    const [query, setLocalQuery] = useState("")
    const [price, setPrice] = useState(5000000)
    const [radius, setRadius] = useState(5)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [location, setLocation] = useState("")
    const [gpsLoading, setGpsLoading] = useState(false)

    // 📍 GPS LOCATION
    const detectLocation = () => {
        setGpsLoading(true)

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude

                setLocation(`near ${lat.toFixed(2)}, ${lng.toFixed(2)}`)
                setGpsLoading(false)
            },
            () => {
                setGpsLoading(false)
            }
        )
    }

    // 🤖 AI SUGGEST
    const aiSuggest = () => {
        const finalQuery = `best properties ${location || ""} under ₹${price}`
        setLocalQuery(finalQuery)
        setQuery(finalQuery)
    }

    // ⚡ DYNAMIC SUGGESTIONS
    useEffect(() => {
        if (!query) {
            setSuggestions([])
            return
        }

        const dummy = [
            `${query} luxury villa`,
            `${query} near metro`,
            `${query} furnished apartment`,
            `${query} investment property`,
            `${query} gated community`,
        ]

        setSuggestions(dummy)
    }, [query])

    // APPLY SEARCH
    const apply = () => {
        setQuery(
            `${query} ${location} within ${radius}km under ${price}`
        )
    }

    return (
        <section className="relative px-3 md:px-6 lg:px-8 py-5 md:py-7">

            {/* ========================= */}
            {/* 💎 MAIN SEARCH TERMINAL */}
            {/* ========================= */}

            <div className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.12)]">

                {/* 🔥 BACKGROUND FX */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                    <div className="absolute top-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                    <div className="absolute bottom-[-120px] left-[-120px] h-[240px] w-[240px] rounded-full bg-cyan-500/10 blur-3xl" />

                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,var(--text)_1px,transparent_1px)] [background-size:22px_22px]" />
                </div>

                {/* ========================= */}
                {/* 🏆 TOP BAR */}
                {/* ========================= */}

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-[var(--border)] px-5 md:px-8 py-5">

                    {/* LEFT */}
                    <div>

                        <div className="flex items-center gap-4">

                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                <Radar size={26} />
                            </div>

                            <div>

                                <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none text-[var(--text)]">
                                    Smart Property{" "}

                                    <span className="italic bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent">
                                        Discovery
                                    </span>
                                </h2>

                                <p className="mt-2 text-[10px] uppercase tracking-[0.35em] font-bold text-[var(--text-soft)] opacity-70">
                                    AI Powered Real Estate Intelligence
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3 flex-wrap">

                        <div className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card-soft)] text-xs font-bold tracking-[0.18em] uppercase text-[var(--text)]">
                            Live Search Engine
                        </div>

                        <div className="px-4 py-2 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 text-xs font-bold tracking-[0.18em] uppercase text-[var(--gold)]">
                            Premium AI Layer
                        </div>
                    </div>
                </div>

                {/* ========================= */}
                {/* 🔍 SEARCH CORE */}
                {/* ========================= */}

                <div className="relative z-10 p-5 md:p-8 space-y-6">

                    {/* SEARCH BAR */}
                    <div className="flex flex-col lg:flex-row gap-3">

                        <div className="relative flex-1">

                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />

                            <input
                                value={query}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                placeholder="Search luxury villas, apartments, penthouses, investments..."
                                className="w-full h-14 rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] pl-12 pr-4 outline-none text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--gold)]/40 transition-all"
                            />
                        </div>

                        <button
                            onClick={apply}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-sm bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
                        >
                            Search
                        </button>
                    </div>

                    {/* ⚡ AI SUGGESTIONS */}
                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-3">

                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setLocalQuery(s)
                                        setQuery(s)
                                    }}
                                    className="group flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-soft)] px-4 py-2 text-xs font-bold tracking-wide text-[var(--text)] transition-all duration-300 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/10"
                                >
                                    <Sparkles size={12} className="text-[var(--gold)]" />

                                    {s}

                                    <ChevronRight size={12} className="opacity-50 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ========================= */}
                    {/* 🎛 FILTER GRID */}
                    {/* ========================= */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* 💰 BUDGET */}
                        <div className="relative overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card-soft)] p-5">

                            <div className="flex items-center justify-between mb-5">

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
                                        Budget Range
                                    </p>

                                    <h3 className="text-2xl font-black mt-2">
                                        ₹ {price.toLocaleString()}
                                    </h3>
                                </div>

                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--gold)]/10 text-[var(--gold)]">
                                    <SlidersHorizontal size={20} />
                                </div>
                            </div>

                            <input
                                type="range"
                                min={1000000}
                                max={50000000}
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full accent-[var(--gold)]"
                            />
                        </div>

                        {/* 📍 LOCATION */}
                        <div className="relative overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card-soft)] p-5">

                            <div className="flex items-center justify-between mb-5">

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
                                        Smart Location
                                    </p>

                                    <h3 className="text-lg font-black mt-2 truncate">
                                        {location || "GPS Not Detected"}
                                    </h3>
                                </div>

                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                                    <MapPin size={20} />
                                </div>
                            </div>

                            <button
                                onClick={detectLocation}
                                className="w-full h-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 font-bold tracking-wide transition-all duration-500 hover:bg-cyan-500 hover:text-black"
                            >
                                {gpsLoading ? "Detecting..." : "Detect My Location"}
                            </button>
                        </div>

                        {/* 🤖 AI */}
                        <div className="relative overflow-hidden rounded-[26px] border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold)]/10 to-transparent p-5">

                            <div className="flex items-center justify-between mb-5">

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
                                        AI Engine
                                    </p>

                                    <h3 className="text-2xl font-black mt-2">
                                        Smart Match
                                    </h3>
                                </div>

                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                                    <Wand2 size={20} />
                                </div>
                            </div>

                            <button
                                onClick={aiSuggest}
                                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black font-black uppercase tracking-[0.18em] text-xs transition-all duration-500 hover:scale-[1.02] active:scale-95"
                            >
                                Generate AI Suggestions
                            </button>
                        </div>
                    </div>

                    {/* 📏 RADIUS */}
                    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card-soft)] p-5">

                        <div className="flex items-center justify-between mb-4">

                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
                                    Search Radius
                                </p>

                                <h3 className="text-2xl font-black mt-2">
                                    {radius} KM
                                </h3>
                            </div>

                            <div className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-bold uppercase tracking-[0.2em]">
                                Precision Search
                            </div>
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="w-full accent-[var(--gold)]"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}