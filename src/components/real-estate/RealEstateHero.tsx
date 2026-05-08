"use client"

import { useState, useEffect } from "react"
import { Search, Mic, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
        ].filter(s =>
            s.toLowerCase().includes(query.toLowerCase())
        )

        setSuggestions(local)

    }, [query])

    const startVoice = () => {

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition)
            return alert("Voice not supported")

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

        <section className="relative w-full h-[78vh] md:h-[88vh] overflow-hidden flex items-center justify-center rounded-b-[32px]">

            {/* BG IMAGE */}
            <AnimatePresence mode="wait">

                <picture className="absolute inset-0 w-full h-full">
                    {/* Mobile optimized source */}
                    <source
                        media="(max-width: 768px)"
                        srcSet={images[index].replace("w=1920", "w=800&q=70")}
                    />
                    <motion.img
                        key={index}
                        src={images[index]}
                        initial={{ scale: 1.12, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.4 }}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000
            ${isDay ? "brightness-[1.02]" : "brightness-[0.6] contrast-[1.1] grayscale-[10%]"}
        `}
                    />
                </picture>

            </AnimatePresence>

            {/* DAY / NIGHT OVERLAY */}
            {/* Replace your existing overlays with this dynamic logic */}
            <div className={`absolute inset-0 transition-all duration-700
    ${isDay
                    ? "bg-gradient-to-b from-white/10 via-transparent to-[var(--bg)]"
                    : "bg-gradient-to-b from-black/20 via-black/40 to-[var(--bg)]"}
`} />

            {/* Extra Glow Layer for Night Mode */}
            {!isDay && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
            )}

            {/* PREMIUM GRADIENT */}
            <div
                className={`absolute inset-0
    ${isDay
                        ? "bg-gradient-to-b from-white/0 via-white/0 to-[#f6f1e8]/15"
                        : "bg-gradient-to-b from-black/10 via-black/30 to-black/80"
                    }
    `}
            />

            {/* AI CHAT */}


            {/* CONTENT */}
            <div className="relative z-20 w-full max-w-5xl mx-auto px-4 text-center">

                {/* TITLE */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                >

                    <h1
                        className={`
                        gth-title
                        text-4xl
                        md:text-7xl
                        leading-[0.95]
                        tracking-[-0.04em]
                        ${isDay
                                ? "text-slate-900"
                                : "text-white"
                            }
                        `}
                    >
                        GLOBAL PROPERTY
                        <br />

                        <span className="gold-text">
                            MARKETPLACE
                        </span>

                    </h1>

                    <p
                        className={`
                        mt-5
                        text-sm
                        md:text-lg
                        max-w-2xl
                        mx-auto
                        ${isDay
                                ? "text-slate-700"
                                : "text-white/70"
                            }
                        `}
                    >
                        Buy • Rent • Invest in premium real estate worldwide
                    </p>

                </motion.div>

                {/* TABS */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide justify-start md:justify-center mt-8 pb-2">

                    {tabs.map((t: string) => (

                        <button
                            key={t}
                            onClick={() => handleTab(t)}
                            className={`
                            px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all duration-300 shrink-0
                            
                            ${activeTab === t
                                    ? "gth-btn scale-105"
                                    : `
                                    ${isDay
                                        ? "bg-white/70 text-slate-700 border border-white/60"
                                        : "bg-white/10 text-white border border-white/10"
                                    }
                                    backdrop-blur-xl
                                    hover:scale-105
                                `
                                }
                            `}
                        >
                            {t}
                        </button>

                    ))}

                </div>

                {/* SEARCH */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`
        mt-6
        flex items-center gap-3
        rounded-full
        px-4 py-3
        border
        backdrop-blur-xl
        transition-all duration-300

        ${isDay
                            ? `
                bg-white/45
                border-white/50
                shadow-[0_8px_30px_rgba(255,255,255,0.18)]
            `
                            : `
                bg-white/10
                border-white/10
                shadow-[0_8px_30px_rgba(0,0,0,0.35)]
            `
                        }
    `}
                >

                    <Search
                        size={20}
                        className={isDay ? "text-slate-500" : "text-white/60"}
                    />

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city, budget, 2BHK..."
                        className={`
    flex-1
    bg-transparent
    outline-none
    border-0
    text-sm
    md:text-base
    font-medium

    ${isDay
                                ? "text-slate-800 placeholder:text-slate-500"
                                : "text-white placeholder:text-white/40"
                            }
`}
                    />

                    <MapPin
                        size={18}
                        onClick={getLocation}
                        className={`cursor-pointer transition
                        ${isDay
                                ? "text-slate-500 hover:text-slate-800"
                                : "text-white/60 hover:text-white"
                            }
                        `}
                    />

                    <Mic
                        size={18}
                        onClick={startVoice}
                        className={`cursor-pointer transition
                        ${isDay
                                ? "text-slate-500 hover:text-slate-800"
                                : "text-white/60 hover:text-white"
                            }
                        `}
                    />

                    <button
                        onClick={handleSearch}
                        className="
    gth-btn
    px-5
    py-2.5
    text-xs
    md:text-sm
    rounded-full
"
                    >
                        SEARCH
                    </button>

                </motion.div>

                {/* SUGGESTIONS */}
                {suggestions.length > 0 && (

                    <div
                        className={`
                        mt-4
                        rounded-2xl
                        overflow-hidden
                        backdrop-blur-2xl
                        border

                        ${isDay
                                ? "bg-white/75 border-white/60"
                                : "bg-[#0f172a]/70 border-white/10"
                            }
                        `}
                    >

                        {suggestions.map((s: string, i: number) => (

                            <div
                                key={i}
                                onClick={() => {
                                    setQuery(s)
                                    handleSearch()
                                }}
                                className={`
                                p-4 text-sm cursor-pointer transition border-b last:border-none

                                ${isDay
                                        ? `
                                        border-slate-200/60
                                        hover:bg-slate-100/70
                                        text-slate-700
                                    `
                                        : `
                                        border-white/5
                                        hover:bg-white/5
                                        text-white/80
                                    `
                                    }
                                `}
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
