"use client"

import { useState } from "react"

type Flight = {
    origin: string
    destination: string
    airline: string
    price: number
    departure_at: string
    duration: number
    airlineLogo: string
    deeplink: string
}

export default function FlightSearch() {
    const [origin, setOrigin] = useState("DEL")
    const [destination, setDestination] = useState("BOM")
    const [date, setDate] = useState("")
    const [flights, setFlights] = useState<Flight[]>([])
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState<"price" | "duration">("price")

    // Format duration in h/m
    const formatDuration = (min: number) => {
        const h = Math.floor(min / 60)
        const m = min % 60
        return `${h}h ${m}m`
    }

    // Sort flights
    const sortedFlights = () => {
        if (sort === "price") return [...flights].sort((a, b) => a.price - b.price)
        if (sort === "duration") return [...flights].sort((a, b) => a.duration - b.duration)
        return flights
    }

    // Fetch flights from Aviasales API
    const searchFlights = async () => {
        if (!origin || !destination || !date) return

        setLoading(true)
        try {
            const res = await fetch(
                `/api/flights/search?origin=${origin}&destination=${destination}&depart_date=${date}`
            )
            const data = await res.json()
            setFlights(data || [])
        } catch (err) {
            console.error("Flight search error:", err)
        }
        setLoading(false)
    }

    return (
        <div className="max-w-6xl mx-auto py-16 text-white">
            {/* SEARCH */}
            <div className="bg-[#111] p-6 rounded-xl border border-yellow-500/20 mb-10">
                <h2 className="text-3xl font-bold mb-6">Search Flights</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <input
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                        placeholder="From (DEL)"
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value.toUpperCase())}
                        placeholder="To (BOM)"
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <button
                        onClick={searchFlights}
                        className="bg-yellow-400 text-black font-semibold rounded"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* LOADING */}
            {loading && <p className="text-yellow-400 mb-6">Searching flights...</p>}

            {/* SORT */}
            {flights.length > 0 && (
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSort("price")}
                        className="bg-zinc-800 px-4 py-2 rounded"
                    >
                        Sort by Price
                    </button>
                    <button
                        onClick={() => setSort("duration")}
                        className="bg-zinc-800 px-4 py-2 rounded"
                    >
                        Sort by Duration
                    </button>
                </div>
            )}

            {/* RESULTS */}
            <div className="space-y-6">
                {sortedFlights().map((f, i) => (
                    <div
                        key={i}
                        className="flex justify-between items-center bg-[#111] p-6 rounded-xl border border-yellow-500/10 hover:border-yellow-500/40 transition"
                    >
                        {/* LEFT */}
                        <div className="flex items-center gap-4">
                            <img src={f.airlineLogo} alt={f.airline} className="w-10 h-10" />
                            <div>
                                <p className="font-semibold">
                                    {f.origin} → {f.destination}
                                </p>
                                <p className="text-gray-400 text-sm">Airline: {f.airline}</p>
                                <p className="text-gray-400 text-sm">Departure: {f.departure_at}</p>
                                <p className="text-gray-500 text-sm">
                                    Duration: {formatDuration(f.duration)}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-400">₹{f.price}</p>
                            {i === 0 && <span className="text-xs text-green-400">Cheapest</span>}
                            <br />
                            <a
                                href={f.deeplink}
                                target="_blank"
                                className="inline-block mt-2 gth-btn-gold text-black px-5 py-2 rounded-lg font-semibold hover:gth-glass"
                            >
                                Book Now
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* TRENDING ROUTES */}
            <div className="mt-20">
                <h3 className="text-2xl font-bold mb-6">Trending Routes</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {[
                        ["DEL", "DXB"],
                        ["DEL", "BKK"],
                        ["DEL", "SIN"],
                        ["BOM", "CCU"],
                    ].map((r, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900 p-6 rounded-xl border border-zinc-700 hover:border-yellow-400 cursor-pointer"
                            onClick={() => {
                                setOrigin(r[0])
                                setDestination(r[1])
                            }}
                        >
                            <p className="text-lg font-semibold">
                                {r[0]} → {r[1]}
                            </p>
                            <p className="text-gray-400 text-sm">Popular route</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}