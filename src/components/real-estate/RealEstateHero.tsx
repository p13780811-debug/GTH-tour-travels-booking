"use client"

import { useState, useEffect } from "react"
import { Search, Mic, MapPin } from "lucide-react"
import AIChatToggle from "@/components/AIChatToggle"

export default function RealEstateHero({ query, setQuery, onSearch, properties, setFiltered, setActive }: any) {

    const [index, setIndex] = useState(0)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [recent, setRecent] = useState<string[]>([])

    const images = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=90",
        "https://images.unsplash.com/photo-1599809275671-b300947a5927?w=1920&q=90",
    ]

    // 🎥 Slider
    useEffect(() => {
        const t = setInterval(() => {
            setIndex((p) => (p + 1) % images.length)
        }, 5000)
        return () => clearInterval(t)
    }, [])

    const tabs = ["Buy", "Rent", "New Launch", "Commercial"]

    const handleTab = (tab: string) => {
        let q = ""

        if (tab === "Buy") q = "property for sale"
        if (tab === "Rent") q = "property for rent"
        if (tab === "New Launch") q = "new projects"
        if (tab === "Commercial") q = "commercial property"

        setQuery(q)
        onSearch()
    }

    // 🕘 Recent
    useEffect(() => {
        const saved = localStorage.getItem("recent_searches")
        if (saved) setRecent(JSON.parse(saved))
    }, [])

    const saveRecent = (q: string) => {
        const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
        setRecent(updated)
        localStorage.setItem("recent_searches", JSON.stringify(updated))
    }

    // 🤖 Suggestions
    useEffect(() => {
        if (!query) return setSuggestions([])

        const timer = setTimeout(async () => {
            try {
                const res = await fetch("/api/ai-suggest", {
                    method: "POST",
                    body: JSON.stringify({ query })
                })
                const data = await res.json()
                setSuggestions(data || [])
            } catch {
                setSuggestions([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // 🎤 Voice
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

    // 📍 Location
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

    return (
        <section className="relative w-full h-[320px] md:h-[420px] flex items-end justify-center pb-10">

            {/* 💬 AI CHAT */}


            {/* IMAGE */}
            <img
                src={images[index]}
                className="absolute inset-0 w-full h-full object-cover transition duration-700"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute top-3 right-3 text-xs bg-black/40 px-2 py-1 rounded text-cyan-300">
                AI Powered Search ⚡
            </div>
            {/* CONTENT */}
            <div className="relative z-10 w-full max-w-6xl px-4">

                <h1 className="text-white text-2xl md:text-4xl font-bold mb-4">
                    Find Your Dream Property 🌍
                </h1>
                {/* TABS */}
                <div className="flex gap-3 mb-3 overflow-x-auto">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => handleTab(t)}
                            className="px-4 py-1 text-sm bg-white/20 text-white rounded-full hover:bg-white/30"
                        >
                            {t}
                        </button>
                    ))}
                </div>
                {/* SEARCH BOX */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3">

                    <div className="flex flex-col md:flex-row gap-2 items-center">

                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 w-full">
                            <Search size={18} />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search properties..."
                                className="w-full py-2 outline-none text-black"
                            />
                        </div>

                        <div className="flex gap-3">
                            <MapPin onClick={getLocation} className="text-white cursor-pointer" />
                            <Mic onClick={startVoice} className="text-white cursor-pointer" />

                            <button
                                onClick={() => {
                                    saveRecent(query)
                                    onSearch()
                                }}
                                className="bg-cyan-500 text-black px-6 py-2 rounded font-bold"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🤖 AI HELPER */}
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
                                onSearch()
                            }}
                            className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full hover:bg-cyan-500/30"
                        >
                            🤖 {item}
                        </button>
                    ))}

                </div>

                {query && (
                    <p className="text-xs text-cyan-300 mt-2">
                        🤖 AI Suggestion: Try searching like "2BHK under 40L in Mumbai"
                    </p>
                )}

                {/* SUGGESTIONS */}
                {suggestions.length > 0 && (
                    <div className="bg-white mt-2 rounded shadow">
                        {suggestions.map((s, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setQuery(s)
                                    saveRecent(s)
                                    onSearch()
                                }}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
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