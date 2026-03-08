"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cities } from "@/data/cities"

export default function SearchBox() {

    const [query, setQuery] = useState("")
    const router = useRouter()

    const filteredCities = cities.filter((city) =>
        city.toLowerCase().includes(query.toLowerCase())
    )

    function handleSearch(city: string) {
        router.push(`/search?q=${query}`)
    }

    return (

        <div className="relative">

            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or hotel..."
                className="w-full px-4 py-2 rounded-lg bg-white text-black"
            />

            {query && (
                <div className="absolute bg-black border border-yellow-500/20 w-full mt-1 rounded-lg max-h-60 overflow-y-auto">

                    {filteredCities.map(city => (
                        <div
                            key={city}
                            onClick={() => handleSearch(city)}
                            className="px-4 py-2 hover:bg-yellow-500 hover:text-black cursor-pointer"
                        >
                            {city}
                        </div>
                    ))}

                </div>
            )}

        </div>
    )
}
