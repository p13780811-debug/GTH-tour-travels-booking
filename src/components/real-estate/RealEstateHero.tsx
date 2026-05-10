"use client"

import { useState, useEffect } from "react"
import { Search, Mic, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function RealEstateHero({
    query,
    setQuery,
    onSearch,
}: any) {

    const [index, setIndex] = useState(0)

    const [suggestions, setSuggestions] = useState<string[]>([])

    const [recent, setRecent] = useState<string[]>([])

    const [activeTab, setActiveTab] = useState("Buy")

    const images = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=90",
        "https://images.unsplash.com/photo-1599423300746-b62533397364?w=1920&q=90",
    ]

    const tabs = [
        "Buy",
        "Rent",
        "New Launch",
        "Commercial",
    ]

    // =========================================
    // AUTO BG SLIDER
    // =========================================

    useEffect(() => {

        const t = setInterval(() => {

            setIndex((p) => (p + 1) % images.length)

        }, 5000)

        return () => clearInterval(t)

    }, [])

    // =========================================
    // RECENT SEARCHES
    // =========================================

    useEffect(() => {

        const saved =
            localStorage.getItem("recent_searches")

        if (saved)
            setRecent(JSON.parse(saved))

    }, [])

    const saveRecent = (q: string) => {

        const updated = [
            q,
            ...recent.filter(r => r !== q)
        ].slice(0, 5)

        setRecent(updated)

        localStorage.setItem(
            "recent_searches",
            JSON.stringify(updated)
        )
    }

    // =========================================
    // LIVE SUGGESTIONS
    // =========================================

    useEffect(() => {

        if (!query)
            return setSuggestions([])

        const local = [
            "2BHK in Mumbai",
            "Villa in Goa",
            "Under 50L",
            "Flats near me",
            "Luxury homes",
            "Sea facing apartment",
            "Premium penthouse",
            "Office space in Kolkata",
            "Smart homes",
            "Investment property",
        ].filter((s) =>
            s.toLowerCase().includes(
                query.toLowerCase()
            )
        )

        setSuggestions(local)

    }, [query])

    // =========================================
    // VOICE SEARCH
    // =========================================

    const startVoice = () => {

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {

            alert("Voice not supported")

            return
        }

        const rec = new SpeechRecognition()

        rec.lang = "en-IN"

        rec.start()

        rec.onresult = (e: any) => {

            const text =
                e.results[0][0].transcript

            setQuery(text)

            saveRecent(text)

            onSearch()
        }
    }

    // =========================================
    // GEO LOCATION
    // =========================================

    const getLocation = () => {

        navigator.geolocation.getCurrentPosition(
            async (pos) => {

                const {
                    latitude,
                    longitude
                } = pos.coords

                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                )

                const data = await res.json()

                const city =
                    data.address.city ||
                    data.address.town ||
                    data.address.state

                const q =
                    `property in ${city}`

                setQuery(q)

                saveRecent(q)

                onSearch()
            }
        )
    }

    // =========================================
    // TABS
    // =========================================

    const handleTab = (tab: string) => {

        setActiveTab(tab)

        let q = ""

        if (tab === "Buy")
            q = "buy property"

        if (tab === "Rent")
            q = "rent property"

        if (tab === "New Launch")
            q = "new projects"

        if (tab === "Commercial")
            q = "commercial property"

        setQuery(q)

        onSearch()
    }

    // =========================================
    // SEARCH
    // =========================================

    const handleSearch = () => {

        if (!query.trim())
            return

        saveRecent(query)

        onSearch()
    }

    return (

        <section
            className="
                relative
                flex
                h-[78vh]
                md:h-[88vh]
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-b-[40px]
            "
        >

            {/* ========================================= */}
            {/* BACKGROUND IMAGE */}
            {/* ========================================= */}

            <AnimatePresence mode="wait">

                <picture
                    className="
                        absolute
                        inset-0
                        h-full
                        w-full
                    "
                >

                    <source
                        media="(max-width:768px)"
                        srcSet={images[index].replace(
                            "w=1920",
                            "w=900&q=70"
                        )}
                    />

                    <motion.img
                        key={index}
                        src={images[index]}
                        initial={{
                            scale: 1.12,
                            opacity: 0,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        transition={{
                            duration: 1.4,
                        }}
                        className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            brightness-[0.65]
                            contrast-[1.08]
                            saturate-[1.05]
                            transition-all
                            duration-1000
                        "
                    />

                </picture>

            </AnimatePresence>

            {/* ========================================= */}
            {/* GLOBAL OVERLAY */}
            {/* ========================================= */}

            <div
                className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-black/20
                    via-black/40
                    to-[#020617]
                "
            />

            {/* ========================================= */}
            {/* CYAN GLOW */}
            {/* ========================================= */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.10)_0%,transparent_45%)]
                "
            />

            {/* ========================================= */}
            {/* GOLD GLOW */}
            {/* ========================================= */}

            <div
                className="
                    pointer-events-none
                    absolute
                    bottom-[-200px]
                    left-1/2
                    h-[500px]
                    w-[500px]
                    -translate-x-1/2
                    rounded-full
                    bg-[#d4af37]/10
                    blur-[120px]
                "
            />

            {/* ========================================= */}
            {/* GRID FX */}
            {/* ========================================= */}

            <div
                className="
                    gth-grid-luxury
                    absolute
                    inset-0
                    opacity-[0.15]
                "
            />

            {/* ========================================= */}
            {/* CONTENT */}
            {/* ========================================= */}

            <div
                className="
                    relative
                    z-20
                    mx-auto
                    w-full
                    max-w-6xl
                    px-4
                    text-center
                    md:px-8
                "
            >

                {/* ========================================= */}
                {/* TITLE */}
                {/* ========================================= */}

                <motion.div
                    initial={{
                        y: 40,
                        opacity: 0,
                    }}
                    animate={{
                        y: 0,
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.8,
                    }}
                >

                    <div
                        className="
                            mb-5
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-cyan-400/20
                            bg-cyan-400/10
                            px-5
                            py-2
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.3em]
                            text-cyan-300
                            backdrop-blur-2xl
                        "
                    >

                        GLOBAL AI REAL ESTATE HUB

                    </div>

                    <h1
                        className="
                            gth-title
                            text-4xl
                            font-black
                            leading-[0.92]
                            tracking-[-0.05em]
                            text-white
                            md:text-7xl
                        "
                    >

                        GLOBAL PROPERTY

                        <br />

                        <span className="gold-text">

                            MARKETPLACE

                        </span>

                    </h1>

                    <p
                        className="
                            mx-auto
                            mt-6
                            max-w-2xl
                            text-sm
                            leading-relaxed
                            text-white/70
                            md:text-lg
                        "
                    >

                        Buy • Rent • Invest in premium
                        real estate worldwide with
                        AI-powered discovery experience

                    </p>

                </motion.div>

                {/* ========================================= */}
                {/* TABS */}
                {/* ========================================= */}

                <div
                    className="
                        mt-10
                        flex
                        justify-start
                        gap-3
                        overflow-x-auto
                        pb-2
                        scrollbar-hide
                        md:justify-center
                    "
                >

                    {tabs.map((t: string) => (

                        <button
                            key={t}
                            onClick={() => handleTab(t)}
                            className={`
                                rounded-full
                                border
                                px-5
                                py-3
                                text-sm
                                font-bold
                                whitespace-nowrap
                                transition-all
                                duration-300
                                shrink-0
                                backdrop-blur-2xl

                                ${activeTab === t
                                    ? "gth-btn scale-105"
                                    : `
                                        border-white/10
                                        bg-white/[0.06]
                                        text-white/75

                                        hover:border-cyan-400/30
                                        hover:bg-white/[0.10]
                                        hover:text-white
                                        hover:scale-105
                                    `
                                }
                            `}
                        >

                            {t}

                        </button>

                    ))}

                </div>

                {/* ========================================= */}
                {/* SEARCH BAR */}
                {/* ========================================= */}

                <motion.div
                    initial={{
                        y: 25,
                        opacity: 0,
                    }}
                    animate={{
                        y: 0,
                        opacity: 1,
                    }}
                    transition={{
                        delay: 0.25,
                    }}
                    className="
                        relative
                        mt-7
                    "
                >

                    {/* glow */}
                    <div
                        className="
                            absolute
                            inset-0
                            rounded-full
                            bg-gradient-to-r
                            from-cyan-400/0
                            via-[#d4af37]/0
                            to-[#d4af37]/0
                        "
                    />

                    <div
                        className="
                            gth-glass-ultra
                            mx-auto
                            max-w-4xl
                            relative
                            flex
                            items-center
                            gap-3
                            rounded-full
                            border
                            border-white/10
                            px-4
                            py-3
                            shadow-[0_20px_60px_rgba(0,0,0,0.45)]
                           
                        "
                    >

                        {/* SEARCH ICON */}

                        <div
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-full
                                bg-white/[0.06]
                                text-white/70
                            "
                        >

                            <Search size={18} />

                        </div>

                        {/* INPUT */}

                        <input
                            value={query}
                            onChange={(e) =>
                                setQuery(
                                    e.target.value
                                )
                            }
                            placeholder="Search city, budget, villa, 2BHK..."
                            className="
                                flex-1
                                bg-transparent
                                text-sm
                                font-medium
                                text-white
                                outline-none
                                placeholder:text-white/40
                                md:text-base
                            "
                        />

                        {/* LOCATION */}

                        <button
                            onClick={getLocation}
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-full
                                bg-white/[0.06]
                                text-white/70
                                transition-all
                                duration-300

                                hover:bg-cyan-400/20
                                hover:text-cyan-300
                            "
                        >

                            <MapPin size={18} />

                        </button>

                        {/* MIC */}

                        <button
                            onClick={startVoice}
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-full
                                bg-white/[0.06]
                                text-white/70
                                transition-all
                                duration-300

                                hover:bg-[#d4af37]/20
                                hover:text-[#d4af37]
                            "
                        >

                            <Mic size={18} />

                        </button>

                        {/* SEARCH BTN */}

                        <button
                            onClick={handleSearch}
                            className="
                                gth-btn
                                rounded-full
                                px-6
                                py-3
                                text-xs
                                font-black
                                uppercase
                                tracking-[0.2em]
                                md:text-sm
                            "
                        >

                            Search

                        </button>

                    </div>

                </motion.div>

                {/* ========================================= */}
                {/* SUGGESTIONS */}
                {/* ========================================= */}

                {suggestions.length > 0 && (

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 15,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="
                            gth-glass-ultra
                            mx-auto
                            mt-5
                            max-w-4xl
                            overflow-hidden
                            rounded-[28px]
                            border
                            border-white/10
                            backdrop-blur-3xl
                        "
                    >

                        {suggestions.map(
                            (
                                s: string,
                                i: number
                            ) => (

                                <div
                                    key={i}
                                    onClick={() => {

                                        setQuery(s)

                                        handleSearch()
                                    }}
                                    className="
                                        flex
                                        cursor-pointer
                                        items-center
                                        justify-between
                                        border-b
                                        border-white/5
                                        px-5
                                        py-4
                                        text-left
                                        text-sm
                                        text-white/75
                                        transition-all
                                        duration-300

                                        last:border-none

                                        hover:bg-white/[0.04]
                                        hover:text-white
                                    "
                                >

                                    <span>

                                        {s}

                                    </span>

                                    <Search
                                        size={15}
                                        className="
                                            opacity-50
                                        "
                                    />

                                </div>

                            )
                        )}

                    </motion.div>

                )}

                {/* ========================================= */}
                {/* RECENT SEARCHES */}
                {/* ========================================= */}

                {recent.length > 0 && (

                    <div
                        className="
                            mt-8
                            flex
                            flex-wrap
                            items-center
                            justify-center
                            gap-3
                        "
                    >

                        {recent.map((r, i) => (

                            <button
                                key={i}
                                onClick={() => {

                                    setQuery(r)

                                    onSearch()
                                }}
                                className="
                                    rounded-full
                                    border
                                    border-white/10
                                    bg-white/[0.04]
                                    px-4
                                    py-2
                                    text-xs
                                    text-white/60
                                    backdrop-blur-xl
                                    transition-all
                                    duration-300

                                    hover:border-cyan-400/20
                                    hover:bg-cyan-400/10
                                    hover:text-cyan-300
                                "
                            >

                                {r}

                            </button>

                        ))}

                    </div>

                )}

            </div>

        </section>
    )
}