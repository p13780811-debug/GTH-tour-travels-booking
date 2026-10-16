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
        <div className="relative mx-auto w-full min-w-0 max-w-md">
            <div className="group relative flex min-w-0 items-center">
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onKeyDown={handleKeyDown}
                    aria-label="Search GTH PRO cities and services"
                    placeholder="Search cities, hotels..."
                    className="w-full min-w-0 rounded-2xl border border-[var(--border)] bg-transparent py-3 pl-4 pr-12 text-sm text-[var(--text)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
                />

                <button
                    type="button"
                    aria-label="Submit ecosystem search"
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