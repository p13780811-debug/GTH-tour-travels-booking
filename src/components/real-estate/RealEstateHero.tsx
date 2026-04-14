"use client"
import { useState, useEffect } from "react"
import { Search, Mic, MapPin, ChevronDown } from "lucide-react"

export default function RealEstateHero({ query, setQuery, onSearch }: any) {
    const [index, setIndex] = useState(0)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [recent, setRecent] = useState<string[]>([])

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

    // 🕘 RECENT SEARCH
    useEffect(() => {
        const saved = localStorage.getItem("recent_searches")
        if (saved) setRecent(JSON.parse(saved))
    }, [])

    const saveRecent = (q: string) => {
        const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
        setRecent(updated)
        localStorage.setItem("recent_searches", JSON.stringify(updated))
    }

    // 🤖 AI SUGGESTIONS (API READY)
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

    // 📍 LOCATION + CITY NAME
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
        })
    }

    const trending = [
        "2BHK in Dubai",
        "Villa in Goa",
        "Under 50L",
        "Luxury Homes"
    ]

    return (
        <section className="relative w-full h-[300px] md:h-[420px] flex items-end justify-center pb-6 md:pb-12">

            {/* 🖼️ IMAGE */}
            <img
                src={images[index]}
                className="absolute inset-0 w-full h-full object-cover transition duration-700"
            />

            {/* 🔥 GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* CONTENT */}
            <div className="relative z-10 w-full max-w-6xl px-4">

                {/* TITLE */}
                <h1 className="text-white text-xl md:text-3xl font-bold mb-4">
                    Find Your Dream Property 🌍
                </h1>

                {/* 💎 GLASS BOX */}
                <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-xl">

                    {/* TABS */}
                    <div className="flex overflow-x-auto border-b border-white/20">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                className="px-4 py-3 text-white font-semibold whitespace-nowrap hover:bg-white/10"
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="flex flex-col md:flex-row gap-2 p-3 items-center">

                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 w-full">
                            <Search size={18} />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search properties..."
                                className="w-full py-2 outline-none text-black"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <MapPin onClick={getLocation} className="text-white cursor-pointer" />
                            <Mic onClick={startVoice} className="text-white cursor-pointer" />

                            <button
                                onClick={() => {
                                    saveRecent(query)
                                    onSearch()
                                }}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🤖 SUGGESTIONS */}
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

                {/* 🔥 TRENDING */}
                <div className="mt-3 flex flex-wrap gap-2">
                    {trending.map((t, i) => (
                        <span
                            key={i}
                            onClick={() => setQuery(t)}
                            className="text-xs bg-white/20 text-white px-3 py-1 rounded-full cursor-pointer"
                        >
                            {t}
                        </span>
                    ))}
                </div>

                {/* 🕘 RECENT */}
                {recent.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {recent.map((r, i) => (
                            <span
                                key={i}
                                onClick={() => setQuery(r)}
                                className="text-xs bg-white/30 text-white px-3 py-1 rounded-full cursor-pointer"
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}