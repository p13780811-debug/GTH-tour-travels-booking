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
        "https://images.unsplash.com/photo-1599809275671-b300947a5927?w=1920&q=90",
    ]

    const tabs = ["Buy", "Rent", "New Launch", "Commercial"]

    // 🎥 IMAGE SLIDER
    useEffect(() => {
        const t = setInterval(() => {
            setIndex((p) => (p + 1) % images.length)
        }, 5000)
        return () => clearInterval(t)
    }, [])

    // 🕘 LOAD RECENT
    useEffect(() => {
        const saved = localStorage.getItem("recent_searches")
        if (saved) setRecent(JSON.parse(saved))
    }, [])

    const saveRecent = (q: string) => {
        const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
        setRecent(updated)
        localStorage.setItem("recent_searches", JSON.stringify(updated))
    }

    // 🤖 LOCAL SUGGESTIONS (NO 404 ERROR)
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

    // 🎤 VOICE SEARCH
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

    // 📍 LOCATION SEARCH
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

    // 🧠 TAB HANDLER
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

    // 🔍 SEARCH HANDLER
    const handleSearch = () => {
        if (!query.trim()) return
        saveRecent(query)
        onSearch()
    }


    return (
        <section className="relative w-full h-[320px] md:h-[440px] flex items-end justify-center pb-10 overflow-hidden">

            {/* 🤖 AI BUTTON */}
            <div className="absolute bottom-6 right-6 z-20">
                <AIChatToggle />
            </div>

            {/* 🎥 BACKGROUND IMAGE */}
            <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6 }}
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 🌗 DYNAMIC OVERLAY */}
            <div className={`absolute inset-0 transition-all duration-500
                ${isDay
                    ? "bg-white/60 backdrop-blur-[2px]"
                    : "bg-black/70"
                }`} />

            {/* ⚡ AI TAG */}
            <div className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full backdrop-blur-md border
                ${isDay
                    ? "bg-white/70 text-black border-gray-200"
                    : "bg-black/40 text-cyan-300 border-white/10"
                }`}>
                ⚡ AI Powered Search
            </div>

            {/* CONTENT */}
            <div className="relative z-10 w-full max-w-6xl px-4">

                {/* TITLE */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-2xl md:text-4xl font-bold mb-4 leading-tight
                    ${isDay ? "text-black" : "text-white"}`}
                >
                    Find Your Dream Property 🌍
                </motion.h1>

                {/* 🧭 TABS */}
                <div className="flex gap-3 mb-3 overflow-x-auto no-scrollbar">
                    {tabs.map((t: string) => (
                        <button
                            key={t}
                            onClick={() => handleTab(t)}
                            className={`px-4 py-1 text-sm rounded-full whitespace-nowrap transition-all duration-300
                            ${activeTab === t
                                    ? isDay
                                        ? "bg-black text-white shadow"
                                        : "bg-cyan-500 text-black"
                                    : isDay
                                        ? "bg-black/10 text-black hover:bg-black/20"
                                        : "bg-white/20 text-white hover:bg-white/30"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* 🔍 COMMAND CENTER SEARCH */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-3 border backdrop-blur-xl transition-all
                    ${isDay
                            ? "bg-white/80 border-gray-200 shadow-lg"
                            : "bg-white/10 border-white/20 shadow-xl"
                        }`}
                >

                    <div className="flex flex-col md:flex-row gap-2 items-center">

                        {/* INPUT */}
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 w-full shadow-sm">
                            <Search size={18} />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by city, budget, type..."
                                className="w-full py-2 outline-none text-black bg-transparent"
                            />
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3 items-center">

                            <MapPin
                                onClick={getLocation}
                                className={`cursor-pointer transition hover:scale-110 
                                ${isDay ? "text-black" : "text-white"}`}
                            />

                            <Mic
                                onClick={startVoice}
                                className={`cursor-pointer transition hover:scale-110 
                                ${isDay ? "text-black" : "text-white"}`}
                            />

                            <button
                                onClick={handleSearch}
                                className={`px-6 py-2 rounded-lg font-bold transition-all
                                ${isDay
                                        ? "bg-black text-white hover:bg-gray-800"
                                        : "bg-cyan-500 text-black hover:bg-cyan-400"
                                    }`}
                            >
                                Search
                            </button>

                        </div>
                    </div>
                </motion.div>

                {/* 🤖 AI SMART CHIPS */}
                <div className="mt-3 flex flex-wrap gap-2">
                    {[
                        "2BHK under 50L in Mumbai",
                        "Luxury villa in Goa",
                        "Rental flats near me",
                        "High ROI investment property"
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setQuery(item)
                                handleSearch()
                            }}
                            className={`text-xs px-3 py-1 rounded-full transition-all
                            ${isDay
                                    ? "bg-black/10 text-black hover:bg-black/20"
                                    : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                                }`}
                        >
                            🤖 {item}
                        </button>
                    ))}
                </div>

                {/* 💡 AI SUGGESTIONS */}
                {suggestions.length > 0 && (
                    <div className={`mt-2 rounded-xl shadow overflow-hidden
                        ${isDay ? "bg-white" : "bg-black border border-white/10"}
                    `}>
                        {suggestions.map((s: string, i: number) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setQuery(s)
                                    handleSearch()
                                }}
                                className={`p-2 cursor-pointer transition
                                ${isDay
                                        ? "hover:bg-gray-100 text-black"
                                        : "hover:bg-white/10 text-white"
                                    }`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* 🧠 AI HINT */}
                {query && (
                    <p className={`text-xs mt-2
                        ${isDay ? "text-gray-600" : "text-cyan-300"}`}>
                        💡 Try: "3BHK under 80L in Bangalore"
                    </p>
                )}

            </div>
        </section>
    )
}