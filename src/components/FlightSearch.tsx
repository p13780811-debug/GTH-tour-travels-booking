"use client"

import { useState } from "react"

export default function FlightSearch() {

    const [origin, setOrigin] = useState("DEL")
    const [destination, setDestination] = useState("BOM")
    const [date, setDate] = useState("")
    const [flights, setFlights] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    async function searchFlights() {

        setLoading(true)

        const res = await fetch(
            `/api/flights?origin=${origin}&destination=${destination}&depart_date=${date}`
        )

        const data = await res.json()

        setFlights(data.data || [])

        setLoading(false)
    }

    return (

        <div className="max-w-5xl mx-auto bg-[#111] p-8 rounded-xl border border-yellow-500/20">

            {/* Search Row */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">

                <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="From (DEL)"
                    className="p-3 rounded bg-black text-white border border-gray-700"
                />

                <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="To (BOM)"
                    className="p-3 rounded bg-black text-white border border-gray-700"
                />

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="p-3 rounded bg-black text-white border border-gray-700"
                />

                <button
                    onClick={searchFlights}
                    className="bg-yellow-400 text-black font-semibold rounded"
                >
                    Search
                </button>

            </div>

            {/* Loading */}
            {loading && (
                <p className="text-yellow-400">Searching flights...</p>
            )}

            {/* Results */}
            <div className="space-y-4">

                {flights.map((f, i) => (
                    <div key={i} className="bg-black border border-yellow-500/20 p-5 rounded flex justify-between">

                        <div>

                            <p className="text-yellow-400 font-semibold">
                                {f.origin} → {f.destination}
                            </p>

                            <p className="text-gray-400 text-sm">
                                Airline: {f.airline}
                            </p>

                            <p className="text-gray-400 text-sm">
                                Departure: {f.departure_at}
                            </p>

                        </div>

                        <div className="text-right">

                            <p className="text-xl font-bold text-yellow-400">
                                ₹{f.price}
                            </p>

                            <a
                                href={`https://www.aviasales.com${f.link}`}
                                target="_blank"
                                className="text-sm text-blue-400 underline"
                            >
                                Book Flight
                            </a>

                        </div>

                    </div>
                ))}

            </div>

        </div>
    )
}