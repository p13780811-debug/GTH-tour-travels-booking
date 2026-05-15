"use client"

import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useState, useEffect, useRef } from "react"
import TripPlanner from "@/components/TripPlanner"

const slides = [
    {
        video: "/gth-main-tour.mp4",
        mobileImage: "/maldives-bg.jpg",
        title: "Luxury Beach Escape",
        subtitle: "Experience the pinnacle of coastal elegance."
    },
    {
        video: "/gth-main-tour.mp4",
        mobileImage: "/maldives-bg.jpg",
        title: "Elite Hotel Experience",
        subtitle: "Redefining comfort in the world's finest suites."
    },
    {
        video: "/gth-main-tour.mp4",
        mobileImage: "/maldives-bg.jpg",
        title: "Global Travel Redefined",
        subtitle: "Your gateway to the international elite ecosystem."
    }
]

export default function HeroSlider() {

    const [current, setCurrent] = useState(0)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const handleSearch = async (query: string) => {

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {

            if (query.length < 2) {
                setSearchResults([])
                return
            }

            const { data } = await supabase
                .from("destinations")
                .select("*")
                .ilike("name", `%${query}%`)
                .limit(5)

            setSearchResults(data || [])

        }, 400)
    }

    useEffect(() => {

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 8000)

        return () => clearInterval(interval)

    }, [])

    return (

        <section className="relative w-full h-[65vh] min-h-[550px] overflow-hidden bg-background">

            {/* Desktop Video */}
            <video
                key={slides[current].video}
                autoPlay
                loop
                muted
                playsInline
                className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
            >
                <source
                    src={slides[current].video}
                    type="video/mp4"
                />
            </video>

            {/* Mobile Image */}
            <div className="block md:hidden absolute inset-0">
                <Image
                    src={slides[current].mobileImage}
                    alt={slides[current].title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col justify-between py-10">

                {/* Top */}
                <div className="w-full">
                    <div className="max-w-xl backdrop-blur-xl bg-background/10 rounded-[32px] border border-white/10 shadow-2xl">
                        <TripPlanner />
                    </div>
                </div>

                {/* Middle */}
                <div className="flex flex-col items-center text-center gap-4">

                    <span className="text-[var(--gold)] font-black tracking-[0.4em] text-[11px] uppercase">
                        GTH PRO EXCLUSIVE
                    </span>

                    <h1 className="text-4xl md:text-7xl font-white uppercase tracking-tight leading-none max-w-5xl">
                        <span className="gold-text">
                            {slides[current].title}
                        </span>
                    </h1>

                    <p className="text-muted-foreground text-sm md:text-lg max-w-2xl leading-relaxed">
                        {slides[current].subtitle}
                    </p>

                </div>

                {/* Bottom Search */}
                <div className="w-full pb-4">

                    <div className="backdrop-blur-2xl bg-background/10 border border-white/10 rounded-[32px] p-3 md:p-4 flex flex-col md:flex-row gap-3 shadow-2xl">

                        {/* Search */}
                        <div className="relative flex-[2]">

                            <input
                                type="text"
                                placeholder="Where to next?"
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl bg-background/20 text-foreground border border-white/10 outline-none focus:border-primary placeholder:text-muted-foreground"
                            />

                            {searchResults.length > 0 && (

                                <div className="absolute left-0 right-0 top-full mt-3 bg-background/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">

                                    {searchResults.map((item) => (

                                        <a
                                            key={item.id}
                                            href={`/destinations/${item.slug}`}
                                            className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition"
                                        >
                                            <span className="text-foreground text-sm font-medium">
                                                {item.name}
                                            </span>

                                            <span className="text-primary text-[10px] uppercase font-black tracking-widest">
                                                Visit →
                                            </span>
                                        </a>

                                    ))}

                                </div>

                            )}

                        </div>

                        {/* Dates */}
                        <div className="flex flex-1 gap-3">

                            <input
                                type="date"
                                className="flex-1 h-14 px-4 rounded-2xl bg-background/20 text-foreground border border-white/10 outline-none"
                            />

                            <input
                                type="date"
                                className="flex-1 h-14 px-4 rounded-2xl bg-background/20 text-foreground border border-white/10 outline-none"
                            />

                        </div>

                        {/* Button */}
                        <button className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] gth-btn-gold whitespace-nowrap">

                            Search Inventory

                        </button>

                    </div>

                </div>

            </div>

            {/* Right Indicators */}
            <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-20">

                {slides.map((_, i) => (

                    <div
                        key={i}
                        className={`w-[3px] rounded-full transition-all duration-500 ${current === i
                            ? "h-14 bg-primary shadow-[0_0_20px_var(--primary)]"
                            : "h-8 bg-white/20"
                            }`}
                    />

                ))}

            </div>

        </section>

    )
}