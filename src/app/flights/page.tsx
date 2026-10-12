"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FlightHero from '@/components/flights/FlightHero';
import PopularDestinations from "@/components/flights/PopularDestinations";
import { flightDestinations } from "@/data/flight/destinations";


type FlightResult = {
    origin?: string;
    destination?: string;
    airline?: string;
    departure_at?: string;
    price: number;
};

const getAirlineLogo = (name?: string) => {
    if (!name) return null;

    const n = name.toLowerCase();

    if (n.includes("indigo"))
        return "https://upload.wikimedia.org/wikipedia/commons/6/69/IndiGo_logo.svg";

    if (n.includes("air india"))
        return "https://upload.wikimedia.org/wikipedia/en/4/4b/Air_India_logo.svg";

    if (n.includes("emirates"))
        return "https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg";

    return null;
};


function FlightsContent() {
    const params = useSearchParams();

    const origin = params.get("origin") || "DEL";
    const destination = params.get("destination") || "BOM";
    const departDate = params.get("depart_date") || "";

    const [flights, setFlights] = useState<FlightResult[]>([]);
    const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [airlineFilter, setAirlineFilter] = useState("");
    const [sortType, setSortType] = useState("cheapest");

    // Fare data is cached by the provider; it does not confirm booking availability.
    useEffect(() => {
        const controller = new AbortController();
        setFlights([]);
        setFilteredFlights([]);
        setError("");

        if (!departDate) {
            setLoading(false);
            return () => controller.abort();
        }

        if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination ||
            !/^\d{4}-\d{2}-\d{2}$/.test(departDate)) {
            setError("Please choose valid airports and a departure date.");
            setLoading(false);
            return () => controller.abort();
        }

        setLoading(true);
        async function fetchFlights() {
            try {
                const query = new URLSearchParams({ origin, destination, depart_date: departDate });
                const response = await fetch(`/api/flights/search?${query}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error("Flight search failed");
                const data: unknown = await response.json();
                if (!Array.isArray(data)) throw new Error("Unexpected flight response");
                const valid = data.filter((flight): flight is FlightResult =>
                    flight !== null && typeof flight === "object" &&
                    typeof flight.price === "number" && Number.isFinite(flight.price) && flight.price > 0
                );
                if (!controller.signal.aborted) setFlights(valid);
            } catch {
                if (!controller.signal.aborted) setError("Flight fares are temporarily unavailable. Please try again.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        void fetchFlights();
        return () => controller.abort();
    }, [origin, destination, departDate]);

    // ✅ FILTER + SORT
    useEffect(() => {
        let updated = [...flights];

        if (airlineFilter) {
            updated = updated.filter((f) =>
                f.airline?.toLowerCase().includes(airlineFilter.toLowerCase())
            );
        }

        if (sortType === "cheapest") {
            updated.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else {
            updated.sort((a, b) => (b.price || 0) - (a.price || 0));
        }

        setFilteredFlights(updated);
    }, [airlineFilter, flights, sortType]);

    // ✅ CHEAPEST
    const cheapest =
        flights.length > 0
            ? Math.min(...flights.map((f) => f.price))
            : Infinity;

    const groupedByDate: Record<string, number> = {};

    flights.forEach((f) => {
        if (!f.departure_at || typeof f.departure_at !== "string") return;

        const [date] = f.departure_at.split("T");

        if (!groupedByDate[date] || f.price < groupedByDate[date]) {
            groupedByDate[date] = f.price;
        }
    });


    return (
        <div className="relative min-h-screen text-white p-6 overflow-hidden bg-[#050505]">
            <FlightHero />
            <PopularDestinations destinations={flightDestinations} />

            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-black"></div>
            {/* BACKGROUND GLOW */}
            {/* ANIMATED GRADIENT BACKGROUND */}
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(0,150,255,0.12),transparent_40%),radial-gradient(circle_at_50%_50%,rgba(255,0,150,0.08),transparent_50%)] animate-pulse" />
            {/* SOFT LIGHT LAYER */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-black/40 to-black/90"></div>
            {/* FLOATING DOTS */}
            <div className="absolute inset-0 -z-10 opacity-[0.15] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:30px_30px]"></div>
            <div className="absolute inset-0 -z-10">

                <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] gth-btn-gold/20 blur-[120px] rounded-full animate-pulse"></div>

                <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full animate-pulse"></div>

                <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full"></div>

            </div>
            {/* GRID OVERLAY */}
            <div className="absolute inset-0 -z-10 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute inset-0 -z-10 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>


            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white via-yellow-300 to-yellow-500 text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                {origin} → {destination}
            </h1>

            {/* FILTERS */}
            <div className="mb-6 flex gap-4 gth-glass/5 backdrop-blur-lg border border-white/10 p-3 rounded-xl w-fit">
                <input
                    type="text"
                    placeholder="Filter by airline"
                    value={airlineFilter}
                    onChange={(e) => setAirlineFilter(e.target.value)}
                    className="bg-black border border-white/20 px-3 py-2 rounded text-sm"
                />

                <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    className="bg-black border border-white/20 px-3 py-2 rounded text-sm"
                >
                    <option value="cheapest">Cheapest</option>
                    <option value="expensive">Expensive</option>
                </select>
            </div>

            {/* CALENDAR */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                {Object.entries(groupedByDate).map(([date, price]) => (
                    <div
                        key={date}
                        className="bg-black/40 border border-white/10 rounded-xl p-3 text-center text-xs hover:border-yellow-500 transition"
                    >
                        <div className="text-gray-400">{date}</div>
                        <div className="text-yellow-400 font-bold">₹{price}</div>
                    </div>
                ))}
            </div>

            {/* LIST */}
            {loading && <p role="status">Loading available fare data...</p>}
            {error && <p role="alert">{error}</p>}
            {!loading && !error && !departDate && (
                <p role="status">Select a departure date above to view available fare data.</p>
            )}
            {!loading && !error && departDate && filteredFlights.length === 0 && (
                <p role="status">No displayed fares found for this route and date. Try a different date or route.</p>
            )}
            {!loading && !error && filteredFlights.map((f, i) => {
                    const isBest = f.price === cheapest;
                    const logo = getAirlineLogo(f.airline);

                    return (
                        <div

                            key={i}

                            className={`relative overflow-hidden rounded-2xl p-6 mb-6 border transition-all duration-500 group ${isBest
                                ? "border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-black shadow-[0_0_40px_rgba(255,215,0,0.25)]"
                                : "border-white/10 gth-glass/5 backdrop-blur-xl border-white/10 hover:gth-glass/10 hover:scale-[1.01] hover:shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
                                }`}
                        >
                            {/* TOP */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60 transform-gpu hover:-translate-y-1"></div>
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-sm text-gray-400">
                                    {f.origin} → {f.destination}
                                </div>
                                <p className="text-xs text-pink-500 mt-2">
                                    Prices may vary. Click to view live availability.
                                </p>
                                {isBest && (
                                    <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-md rounded font-bold">
                                        Lowest displayed fare
                                    </span>
                                )}
                            </div>

                            {/* AIRLINE */}
                            <div className="flex items-center gap-3 mb-3">
                                {logo && (
                                    <div className="gth-glass/10 p-1 rounded">
                                        <img src={logo} className="h-4 object-contain" />
                                    </div>
                                )}
                                <span className="text-xs text-gray-400 tracking-wide uppercase">
                                    {f.airline || "Private Carrier"}
                                </span>
                            </div>

                            {/* DATE */}
                            <div className="text-xs text-gray-500 mb-3">
                                {f.departure_at}
                            </div>

                            {/* PRICE */}
                            <div className="flex justify-between items-center">
                                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 to-yellow-200 text-transparent bg-clip-text">
                                    ₹{f.price?.toLocaleString()}
                                </div>

                                <a
                                    href={`https://www.aviasales.com/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&depart_date=${encodeURIComponent(departDate)}`}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="gth-btn-gold text-black px-5 py-2 rounded-full text-xs font-bold tracking-widest hover:scale-105 transition-all duration-300 shadow-lg"
                                >
                                    Check with booking partner
                                </a>
                            </div>
                        </div>
                    );
                })

            }
        </div>

    )
}

<PopularDestinations destinations={flightDestinations} />

export default function FlightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading search results...</div>}>
            <FlightsContent />
        </Suspense>
    );
}

