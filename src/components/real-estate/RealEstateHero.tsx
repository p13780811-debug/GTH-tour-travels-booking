"use client"

import { useState, useEffect } from "react"
import { Search, Mic, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import AIChatToggle from "@/components/AIChatToggle"
import { useThemeMode } from "@/lib/hooks/useThemeMode"

export default function RealEstateHero({
    query,
    setQuery,
    onSearch,
}: any) {

    const theme = useThemeMode()
    const isDay = theme === "day"

    const [index, setIndex] = useState(0)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [recent, setRecent] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState("Buy")

    const images = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=90",
        "https://images.unsplash.com/photo-1599423300746-b62533397364?w=1920&q=90",
    ]

    const tabs = ["Buy", "Rent", "New Launch", "Commercial"]

    useEffect(() => {
        const t = setInterval(() => {
            setIndex((p) => (p + 1) % images.length)
        }, 5000)
        return () => clearInterval(t)
    }, [])

    useEffect(() => {
        const saved = localStorage.getItem("recent_searches")
        if (saved) setRecent(JSON.parse(saved))
    }, [])

    const saveRecent = (q: string) => {
        const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
        setRecent(updated)
        localStorage.setItem("recent_searches", JSON.stringify(updated))
    }

    useEffect(() => {
        if (!query) return setSuggestions([])

        const local = [
            "2BHK in Mumbai",
            "Villa in Goa",
            "Under 50L",
            "Flats near me",
            "Luxury homes",
        ].filter(s => s.toLowerCase().includes(query.toLowerCase()))

        setSuggestions(local)
    }, [query])

    const startVoice = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) return alert("Voice not supported")

        const rec = new SpeechRecognition()
        rec.start()

        rec.onresult = (e: any) => {
            const text = e.results[0][0].transcript
            setQuery(text)
            saveRecent(text)
            onSearch()
        }
    }

    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords

            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            )
            const data = await res.json()

            const city =
                data.address.city ||
                data.address.town ||
                data.address.state

            const q = `property in ${city}`
            setQuery(q)
            saveRecent(q)
            onSearch()
        })
    }

    const handleTab = (tab: string) => {
        setActiveTab(tab)

        let q = ""

        if (tab === "Buy") q = "buy property"
        if (tab === "Rent") q = "rent property"
        if (tab === "New Launch") q = "new projects"
        if (tab === "Commercial") q = "commercial property"

        setQuery(q)
        onSearch()
    }

    const handleSearch = () => {
        if (!query.trim()) return
        saveRecent(query)
        onSearch()
    }

    return (
        <section className="relative w-full h-[90vh] md:h-screen flex items-center justify-center overflow-hidden">

            {/* BG IMAGE */}
            <motion.img
                key={index}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6 }}
                src={images[index]}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* PREMIUM GRADIENT */}
            <div className={`absolute inset-0 ${isDay
                ? ``
                : "bg-gradient-to-t from-black via-black/40 to-transparent"
                }`} />

            {/* AI BUTTON */}
            <div className="absolute bottom-6 right-6 z-20">
                <AIChatToggle />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 text-center px-4">

                {/* 🔥 PREMIUM TITLE */}
                <h1 className="gth-title text-3xl md:text-5xl">
                    GLOBAL PROPERTY <br />
                    <span className="gold-text">MARKETPLACE</span>
                </h1>

                <p className="gth-sub">
                    Buy • Rent • Invest in premium real estate worldwide
                </p>

                {/* 🔥 TABS (FIXED) */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
                    {tabs.map((t: string) => (
                        <button
                            key={t}
                            onClick={() => handleTab(t)}
                            className={`px-3 py-1 text-[11px] rounded-full whitespace-nowrap transition shrink-0
          ${activeTab === t
                                    ? "gth-btn"
                                    : "bg-white/10 backdrop-blur text-white hover:bg-white/20"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* 🔥 SEARCH BOX (UPGRADED) */}
                <div className="gth-glass flex items-center gap-3 p-4 max-w-2xl mx-auto">

                    <Search size={18} className="opacity-70" />

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city, budget, 2BHK..."
                        className={`flex-1 bg-transparent outline-none text-sm ${isDay ? "placeholder:text-black/40" : "placeholder:text-white/40"
                            }`}
                    />

                    <MapPin
                        size={18}
                        onClick={getLocation}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                    />

                    <Mic
                        size={18}
                        onClick={startVoice}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                    />

                    {/* ✅ FIXED BUTTON */}
                    <button
                        onClick={handleSearch}
                        className="gth-btn text-xs px-4 py-2"
                    >
                        Search
                    </button>

                </div>



                {/* 🔥 SUGGESTIONS */}
                {suggestions.length > 0 && (
                    <div className="mt-3 gth-glass rounded-xl overflow-hidden">
                        {suggestions.map((s: string, i: number) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setQuery(s)
                                    handleSearch()
                                }}
                                className="p-3 text-sm cursor-pointer hover:bg-white/10 transition"
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </section>
    )
}