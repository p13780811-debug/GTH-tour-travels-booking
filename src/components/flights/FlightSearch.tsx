"use client";

import { useState } from "react";

type Flight = {
    origin: string;
    destination: string;
    airline: string;
    price: number;
    departure_at: string;
    duration: number;
    airlineLogo: string;
    deeplink: string;
};

export default function FlightSearch() {
    const [origin, setOrigin] = useState("DEL");
    const [destination, setDestination] = useState("BOM");
    const [date, setDate] = useState("");
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState("price");

    const searchFlights = async () => {
        if (!destination || !date) return;
        setLoading(true);

        const query = `${origin}-${destination}-${date}`;
        // Direct Aviasales widget deeplink
        window.open(
            `https://aviasales.tpo.lv/KkWURb6L?marker=417668&origin=${origin}&destination=${destination}&depart_date=${date}`,
            "_blank"
        );

        setLoading(false);
    };

    const formatDuration = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="max-w-6xl mx-auto py-16 text-white">
            {/* SEARCH BAR */}
            <div className="bg-[#111] p-6 rounded-xl mb-10 border border-yellow-500/20">
                <h2 className="text-3xl font-bold mb-6">Search Flights</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <input
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                        className="p-3 bg-black border border-gray-700 rounded"
                        placeholder="From (DEL)"
                    />
                    <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value.toUpperCase())}
                        className="p-3 bg-black border border-gray-700 rounded"
                        placeholder="To (BOM)"
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-3 bg-black border border-gray-700 rounded"
                    />
                    <button
                        onClick={searchFlights}
                        className="bg-yellow-400 text-black font-semibold rounded hover:bg-white transition"
                    >
                        Search
                    </button>
                </div>
            </div>

            {loading && <p className="text-yellow-400 mb-4">Opening flight search...</p>}

            {/* TRENDING ROUTES */}
            <div className="mt-16">
                <h3 className="text-2xl font-bold mb-6">Trending Routes</h3>
                <div className="flex gap-4 overflow-x-auto py-4 no-scrollbar">
                    {[
                        ["DEL", "DXB"],
                        ["DEL", "BKK"],
                        ["DEL", "SIN"],
                        ["BOM", "CCU"],
                    ].map(([from, to], i) => (
                        <div
                            key={i}
                            onClick={() => {
                                setOrigin(from);
                                setDestination(to);
                            }}
                            className="min-w-[180px] p-4 bg-zinc-900 rounded-xl border border-zinc-700 hover:border-yellow-400 cursor-pointer flex flex-col items-center justify-center"
                        >
                            <p className="text-lg font-semibold">
                                {from} → {to}
                            </p>
                            <p className="text-gray-400 text-sm">Popular route</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}