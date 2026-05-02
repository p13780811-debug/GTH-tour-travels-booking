"use client"

import { useState, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { cities } from "@/data/cities"

export default function SearchBox() {
    const [query, setQuery] = useState("")
    const router = useRouter()

    const filteredCities = cities.filter((city) =>
        city.toLowerCase().includes(query.toLowerCase())
    )
    const [isOpen, setIsOpen] = useState(false)
    function handleSearch(cityName?: string) {
        const finalQuery = cityName || query;

        if (finalQuery.trim()) {

            setIsOpen(false)

            router.push(`/search?q=${encodeURIComponent(finalQuery.toLowerCase())}`)
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            <div className="relative flex items-center group">
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search city hotel..."
                    className="w-full px-5 py-3 pr-12 rounded-2xl gth-glass/10 backdrop-blur-md text-white border border-white/10 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-500"
                />

                <button
                    onClick={() => handleSearch()}
                    className="absolute right-2 p-2 gth-btn-gold hover:gth-glass text-black rounded-xl transition-all shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>

            {isOpen && query && filteredCities.length > 0 && (
                <div className="absolute z-[100] bg-[#0a0a0a] border border-white/10 w-full mt-2 rounded-2xl max-h-60 overflow-y-auto shadow-2xl overflow-hidden">
                    {filteredCities.map(city => (
                        <div
                            key={city}
                            onClick={() => handleSearch(city)}
                            className="px-5 py-3 hover:gth-btn-gold hover:text-black cursor-pointer text-white font-bold text-sm transition-colors border-b border-white/5 last:border-none"
                        >
                            {city}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}