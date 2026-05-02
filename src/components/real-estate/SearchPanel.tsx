"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Sparkles } from "lucide-react"

export default function SearchPanel({ setQuery }: any) {
    const [query, setLocalQuery] = useState("")
    const [price, setPrice] = useState(5000000)
    const [radius, setRadius] = useState(5)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [location, setLocation] = useState<string>("")

    // 📍 GPS LOCATION
    const detectLocation = () => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude

            setLocation(`near ${lat.toFixed(2)}, ${lng.toFixed(2)}`)
        })
    }

    // 🤖 AI SUGGEST
    const aiSuggest = () => {
        setQuery(`best properties ${location} under ${price}`)
    }

    // ⚡ DYNAMIC SUGGESTIONS
    useEffect(() => {
        if (!query) return setSuggestions([])

        const dummy = [
            `${query} under 50 lakh`,
            `${query} 2bhk`,
            `${query} villa`,
            `${query} near metro`
        ]

        setSuggestions(dummy)
    }, [query])

    // APPLY
    const apply = () => {
        setQuery(`${query} ${location} within ${radius}km under ${price}`)
    }

    return (
        <div className="p-4 rounded-2xl backdrop-blur-xl 
        bg-[var(--card)] border border-[var(--border)] text-[var(--text)] space-y-4">

            {/* SEARCH */}
            <div className="flex gap-2">
                <input
                    value={query}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder="Search properties..."
                    className="flex-1 p-2 rounded bg-transparent border border-[var(--border)]"
                />
                <button onClick={apply} className="bg-cyan-500 px-3 rounded text-black">
                    <Search size={16} />
                </button>
            </div>

            {/* ⚡ SUGGESTIONS */}
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setQuery(s)}
                            className="text-xs px-2 py-1 rounded bg-black/10 md:gth-glass/10"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* 💰 PRICE */}
            <div>
                <p className="text-xs">Budget: ₹ {price}</p>
                <input
                    type="range"
                    min={1000000}
                    max={50000000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* 📍 LOCATION */}
            <button
                onClick={detectLocation}
                className="w-full flex items-center justify-center gap-2 gth-btn-gold text-black py-2 rounded text-sm"
            >
                <MapPin size={14} />
                Detect Location
            </button>

            {/* 📏 RADIUS */}
            <div>
                <p className="text-xs">Radius: {radius} km</p>
                <input
                    type="range"
                    min={1}
                    max={20}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* 🤖 AI */}
            <button
                onClick={aiSuggest}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black py-2 rounded text-sm font-bold"
            >
                <Sparkles size={14} />
                AI Suggest
            </button>

        </div>
    )
}