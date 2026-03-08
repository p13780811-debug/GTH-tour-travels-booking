"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function HotelSearch() {

    const router = useRouter()
    const [city, setCity] = useState("")

    function searchHotels() {

        if (!city) return

        router.push(`/hotels/results?city=${city}`)

    }

    return (

        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">

            <h2 className="text-2xl font-bold mb-4">
                Search Hotels
            </h2>

            <input
                className="w-full border p-3 rounded mb-4"
                placeholder="Enter city (Dubai, Paris, Goa)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
            />

            <button
                onClick={searchHotels}
                className="bg-yellow-500 px-6 py-3 rounded w-full"
            >
                Search
            </button>

        </div>

    )
}