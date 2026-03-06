"use client"

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react"

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
    const [current, setCurrent] = useState(0)

    // --- GTH PRO Search Logic Start ---
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase
            .from('destinations')
            .select('*')
            .ilike('name', `%${query}%`);
        setSearchResults(data || []);
    };
    // --- GTH PRO Search Logic End ---

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative w-full h-screen pt-28 overflow-hidden bg-[#0a0a0a]">

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
                style={{ backgroundImage: `url(${slides[current].image})` }}
            >
                <div className="absolute inset-0 bg-black/70"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">

                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-4xl font-black mb-6 tracking-wide uppercase leading-tight">
                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-700 bg-clip-text text-transparent">
                        {slides[current].title}
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl leading-relaxed">
                    An elite international travel ecosystem connecting luxury hotels,
                    private guides and seamless global booking experiences.
                </p>

                {/* GOLD BOOKING BAR */}
                <div className="bg-black/60 backdrop-blur-lg border border-yellow-500/40 rounded-2xl p-6 flex flex-col md:flex-row gap-4 w-full max-w-5xl shadow-[0_0_40px_rgba(255,215,0,0.15)]">

                    <input
                        type="text"
                        placeholder="Destination"
                        className="flex-1 px-4 py-3 rounded-lg bg-black text-white border border-yellow-500/30 outline-none focus:border-yellow-500"
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {/* GTH PRO Floating Results */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-black/95 border border-yellow-500/40 backdrop-blur-2xl rounded-xl z-[999] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {searchResults.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 hover:bg-yellow-500/10 transition-all border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-yellow-500">📍</span>
                                        <span className="text-white font-medium">{item.name}</span>
                                    </div>
                                    <a
                                        href={`${item.partner_link}&return_url=https://gthpro.com/success`}
                                        className="bg-yellow-500 text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                                    >
                                        BOOK NOW
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    <input
                        type="date"
                        className="flex-1 px-4 py-3 rounded-lg bg-black text-white border border-yellow-500/30 focus:outline-none focus:border-yellow-400"
                    />

                    <input
                        type="date"
                        className="flex-1 px-4 py-3 rounded-lg bg-black text-white border border-yellow-500/30 focus:outline-none focus:border-yellow-400"
                    />

                    <button className="px-8 py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:scale-105 transition">
                        Book Now
                    </button>
                </div>

            </div>
        </section>
    )
}