"use client"

import { useState } from "react"

export default function FlightSearch() {

    const [origin, setOrigin] = useState("DEL")
    const [destination, setDestination] = useState("BOM")
    const [date, setDate] = useState("")
    const [flights, setFlights] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function searchFlights() {

        try {

            setLoading(true)
            setError("")

            const res = await fetch(
                `/api/flights?origin=${origin}&destination=${destination}&depart_date=${date}`
            )

            if (!res.ok) {
                throw new Error("Flight API failed")
            }

            const data = await res.json()

            const results = data?.data || []

            // sort cheapest first
            results.sort((a: any, b: any) => a.price - b.price)

            setFlights(results)

        } catch (e) {

            console.error(e)
            setError("Unable to fetch flights right now")

        } finally {

            setLoading(false)

        }

    }

    return (

        <div className="max-w-6xl mx-auto py-16 px-6">

            {/* HEADER */}

            <div className="mb-10">

                <h2 className="text-4xl font-black text-white mb-2">
                    Search Flights
                </h2>

                <p className="text-gray-400">
                    Find the best flight deals instantly
                </p>

            </div>


            {/* SEARCH PANEL */}

            <div className="bg-[#0f0f0f] border border-yellow-500/20 rounded-2xl p-6 grid md:grid-cols-4 gap-4 mb-10">

                <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="Origin (DEL)"
                    className="bg-black border border-white/10 px-4 py-3 rounded-lg text-white"
                />

                <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="Destination (DXB)"
                    className="bg-black border border-white/10 px-4 py-3 rounded-lg text-white"
                />

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-black border border-white/10 px-4 py-3 rounded-lg text-white"
                />

                <button
                    onClick={searchFlights}
                    disabled={loading}
                    className="gth-btn-gold hover:bg-yellow-400 text-black font-bold rounded-lg transition disabled:opacity-50"
                >

                    {loading ? "Searching..." : "Search Flights"}

                </button>

            </div>


            {/* ERROR */}

            {error && (
                <p className="text-red-400 mb-6">
                    {error}
                </p>
            )}


            {/* LOADING */}

            {loading && (
                <div className="text-yellow-400">
                    Searching best deals...
                </div>
            )}


            {/* RESULTS */}

            <div className="space-y-5">

                {flights.map((f: any, i: number) => {

                    const cheapest = i === 0

                    return (

                        <div
                            key={i}
                            className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6 flex justify-between items-center hover:border-yellow-500/40 transition"
                        >

                            {/* LEFT */}

                            <div>

                                <div className="flex items-center gap-3 mb-2">

                                    <p className="text-white font-bold text-lg">
                                        {f.origin} → {f.destination}
                                    </p>

                                    {cheapest && (
                                        <span className="gth-btn-gold text-black text-xs px-2 py-1 rounded">
                                            Best Deal
                                        </span>
                                    )}

                                </div>

                                <p className="text-gray-400 text-sm">
                                    Airline: {f.airline || "Multiple airlines"}
                                </p>

                                <p className="text-gray-400 text-sm">
                                    Departure: {f.departure_at
                                        ? new Date(f.departure_at).toLocaleDateString()
                                        : "N/A"}
                                </p>

                            </div>


                            {/* RIGHT */}

                            <div className="text-right">

                                <p className="text-3xl font-black text-yellow-400 mb-2">
                                    ₹{f.price}
                                </p>

                                <a
                                    href={`https://aviasales.tp.st/?origin=${f.origin}&destination=${f.destination}&departure_at=${f.departure_at}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gth-btn-gold hover:gth-glass text-black px-5 py-2 rounded-lg text-sm font-bold transition"
                                >

                                    Book Flight

                                </a>

                            </div>

                        </div>

                    )

                })}

            </div>


            {/* EMPTY STATE */}

            {!loading && flights.length === 0 && (

                <div className="text-gray-500 mt-10">
                    No flights found. Try a different route.
                </div>

            )}

        </div>

    )

}