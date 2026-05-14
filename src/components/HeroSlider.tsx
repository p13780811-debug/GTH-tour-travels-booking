"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import TripPlanner from "@/components/TripPlanner"

const slides = [
    {
        video: "/gth-main-tour.mp4", // Aapka social media wala video path
        title: "Luxury Beach Escape",
        subtitle: "Experience the pinnacle of coastal elegance."
    },
    {
        video: "gth-main-tour.mp4",
        title: "Elite Hotel Experience",
        subtitle: "Redefining comfort in the world's finest suites."
    },
    {
        video: "gth-main-tour.mp4",
        title: "Global Travel Redefined",
        subtitle: "Your gateway to the international elite ecosystem."
    }
];


export default function HeroSlider() {
    const [current, setCurrent] = useState(0)
    const [searchResults, setSearchResults] = useState<any[]>([])

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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 8000) // 8 seconds for video flow
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative w-full h-[85vh] min-h-[750px] overflow-hidden bg-black">

            {/* --- VIDEO BACKGROUND LAYER --- */}
            <div className="absolute inset-0 z-0">
                <video
                    key={slides[current].video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60 scale-105 transition-all duration-1000"
                >
                    <source src={slides[current].video} type="video/mp4" />
                </video>
                {/* Vignette Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black"></div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-between py-12">

                {/* TOP: AI Trip Planner with Glass Effect */}
                <div className="w-full animate-fade-in-down">
                    <div className="max-w-xl backdrop-blur-md bg-black/20 p-1 rounded-3xl border border-white/5 shadow-2xl">
                        <TripPlanner />
                    </div>
                </div>

                {/* MIDDLE: Hero Text with Premium Typography */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <span className="text-[#d4af37] font-bold tracking-[0.6em] text-[20px] uppercase animate-pulse">
                        GTH Pro Exclusive
                    </span>

                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                        <span className="bg-gradient-to-r from-[#d4af37] via-yellow-200 to-[#8a6d3b] gold-text filter drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                            {slides[current].title}
                        </span>
                    </h1>

                    <p className="text-sm md:text-lg text-gray-400 max-w-2xl font-light tracking-wide leading-relaxed">
                        {slides[current].subtitle}
                    </p>
                </div>

                {/* BOTTOM: Ultimate Search Bar */}
                <div className="w-full pb-8">
                    <div className="backdrop-blur-3xl gth-glass/5 border border-white/10 rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-4 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">

                        {/* Destination Input */}
                        <div className="relative flex-[2]">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-yellow-500/50">📍</div>
                            <input
                                type="text"
                                placeholder="Where to next?"
                                className="w-full pl-12 pr-5 py-5 rounded-3xl gth-glass/5 text-white border border-white/5 focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-gray-500 text-sm"
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            {/* Dropdown Polish */}
                            {searchResults.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-6 bg-black/90 border border-[#d4af37]/30 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                                    {searchResults.map((item) => (
                                        <a key={item.id} href={`/destinations/${item.slug}`} className="flex justify-between items-center p-5 hover:bg-[#d4af37]/10 transition-colors group">
                                            <span className="text-white font-medium">{item.name}</span>
                                            <span className="text-[#d4af37] text-[10px] font-black group-hover:translate-x-1 transition-transform uppercase">Visit →</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="flex flex-1 gap-2">
                            <input type="date" className="flex-1 px-4 py-5 rounded-3xl gth-glass/5 text-white border border-white/5 text-[10px] outline-none hover:border-[#d4af37]/20 transition-all custom-calendar-icon" />
                            <input type="date" className="flex-1 px-4 py-5 rounded-3xl gth-glass/5 text-white border border-white/5 text-[10px] outline-none hover:border-[#d4af37]/20 transition-all" />
                        </div>

                        {/* Search Button */}
                        <button className="flex-1 px-10 py-5 rounded-3xl font-black text-black bg-gradient-to-r from-[#d4af37] to-[#8a6d3b] hover:brightness-125 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)] uppercase text-[10px] tracking-widest active:scale-95">
                            Search Inventory
                        </button>
                    </div>
                </div>

            </div>

            {/* Slider Dots */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`h-12 w-1 transition-all duration-500 ${current === i ? 'bg-[#d4af37] shadow-[0_0_15px_#d4af37]' : 'gth-glass/20'}`}
                    />
                ))}
            </div>
        </section>
    )
}