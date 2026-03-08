"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

import TripPlanner from "@/components/TripPlanner"
const slides = [
    {
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        title: "Luxury Beach Escape",
    },
    {
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        title: "Elite Hotel Experience",
    },
    {
        image: "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
        title: "Global Travel Redefined",
    },
]

export default function HeroSlider() {
    // --- States ---
    const [current, setCurrent] = useState(0)
    const [searchResults, setSearchResults] = useState<any[]>([])

    // --- Search Logic (Original) ---
    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        const { data } = await supabase
            .from("destinations")
            .select("*")
            .ilike("name", `%${query}%`)

        setSearchResults(data || [])
    }

    // --- Slider Interval ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative w-full h-[50vh] min-h-[600px] overflow-hidden bg-[#0a0a0a]">

            {/* Background Image Layer */}
            <div
                className="absolute inset-0  bg-cover bg-center transition-all duration-1000 scale-105"
                style={{ backgroundImage: `url(${slides[current].image})` }}
            >
                {/* Overlay for Readability */}
                <div className="absolute inset-0 bg-black/65"></div>
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-between py-16">

                {/* SECTION 1: AI TRIP PLANNER (Top) */}
                <div className="w-full flex justify-start">
                    <div className="w-full max-w-2xl">
                        {/* Aapne jo overlay code diya tha, 
                           usse absolute hata kar yahan TripPlanner 
                           ko wrapper mein dala hai taaki overlap na ho
                        */}
                        <TripPlanner />
                    </div>
                </div>

                {/* SECTION 2: HERO TEXT (Middle) */}
                <div className="flex flex-col items-center justify-center text-center">

                    <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter">
                        <span className="bg-gradient-to-b from-yellow-500 bg-clip-text text-transparent drop-shadow-20xl0">
                            {slides[current].title}
                        </span>
                    </h1>

                    <p className="text-sm md:text-xl text-gray-200 max-w-3xl leading-relaxed font-medium drop-shadow-lg">
                        Discover curated luxury hotels, private guides and elite global travel
                        experiences through the GTH international ecosystem.
                    </p>

                </div>

                {/* SECTION 3: SEARCH BAR (Bottom Wide) */}
                <div className="w-full">

                    <div className="bg-black/65 backdrop-blur-2xl border border-yellow-500/25 rounded-2xl p-3 flex flex-col md:flex-row gap-4 w-full shadow-[0_20px_50px_rgba(0,0,0,0.6)]">

                        {/* Destination Input */}
                        <div className="relative flex-[2.5]">
                            <input
                                type="text"
                                placeholder="Search destination..."
                                className="w-full px-5 py-4 rounded-xl bg-white/5 text-white border border-white/10 focus:border-yellow-500/60 outline-none transition-all placeholder:text-gray-500"
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            {/* Search Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-4 bg-black/95 border border-yellow-500/40 backdrop-blur-2xl rounded-2xl z-[999] max-h-60 overflow-y-auto shadow-2xl">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between items-center p-4 hover:bg-yellow-500/10 transition border-b border-white/5 last:border-0"
                                        >
                                            <span className="text-white font-bold">{item.name}</span>
                                            <a
                                                href={`/destinations/${item.slug}`}
                                                className="bg-yellow-500 text-black text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest"
                                            >
                                                Book Now
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Inputs */}
                        <div className="flex flex-1 gap-3">
                            <input
                                type="date"
                                className="flex-1 px-4 py-4 rounded-xl bg-white/5 text-white border border-white/10 text-xs outline-none focus:border-yellow-500/40"
                            />
                            <input
                                type="date"
                                className="flex-1 px-4 py-4 rounded-xl bg-white/5 text-white border border-white/10 text-xs outline-none focus:border-yellow-500/40"
                            />
                        </div>

                        {/* Search Button */}
                        <button className="px-12 py-4 rounded-xl font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 transition-all shadow-xl uppercase text-xs tracking-[0.2em] active:scale-95">
                            Search Hotels
                        </button>

                    </div>
                </div>

            </div>
        </section>
    )
}