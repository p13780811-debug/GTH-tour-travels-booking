import { getTours } from "@/lib/tours"
import MapWrapper from "@/components/MapWrapper"
import { useState } from "react"

export const dynamic = "force-dynamic"

type SearchParams = {
    city?: string
    minPrice?: string
    maxPrice?: string
    category?: string
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {

    const params = await searchParams

    const tours = await getTours({
        city: params.city,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        category: params.category,
    })
    const symbolMap: any = {
        INR: "₹",
        USD: "$",
        EUR: "€"
    };
    const sorted = [...tours].sort((a, b) => a.price - b.price)

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">

            {/* 🔥 HERO (FIXED UI — NO BLOB) */}
            <div className="relative w-full border-b border-white/10 bg-black">

                <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&w=1600')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black"></div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">

                    <h1 className="text-4xl md:text-6xl font-black uppercase mb-2">
                        GTH<span className="text-yellow-500">PRO</span>
                    </h1>

                    <p className="text-gray-400 mb-8">
                        Discover Premium Tours & Destinations
                    </p>

                    {/* 🔥 TABS (UI ONLY – NO BREAK) */}
                    <div className="flex gap-6 mb-6 text-sm font-semibold uppercase">
                        <a href="/" className="text-yellow-500 border-b-2 border-yellow-500 pb-1">
                            Tours
                        </a>
                        <a href="/flights" className="text-gray-400 hover:text-white">
                            Flights
                        </a>
                        <a href="/hotels" className="text-gray-400 hover:text-white">
                            Hotels
                        </a>
                        <a href="/guides" className="text-gray-400 hover:text-white">
                            Guides
                        </a>
                    </div>

                    {/* 🔥 WORKING SEARCH (TOURS ONLY) */}
                    <form
                        method="GET"
                        className="bg-[#0d0d0d] border border-white/10 rounded-xl p-2 flex flex-col md:flex-row gap-2 shadow-xl"
                    >

                        <div className="flex-1 flex items-center gap-2 px-3 py-2 border-r border-white/10">
                            <span>📍</span>
                            <input
                                name="city"
                                defaultValue={params.city || ""}
                                placeholder="Search destination..."
                                className="bg-transparent outline-none w-full text-sm"
                            />
                        </div>

                        <div className="flex-1 flex items-center gap-2 px-3 py-2 border-r border-white/10">
                            <span>💰</span>
                            <input
                                name="minPrice"
                                defaultValue={params.minPrice || ""}
                                placeholder="Min Price"
                                className="bg-transparent outline-none w-full text-sm"
                            />
                        </div>

                        <div className="flex-1 flex items-center gap-2 px-3 py-2 border-r border-white/10">
                            <span>💰</span>
                            <input
                                name="maxPrice"
                                defaultValue={params.maxPrice || ""}
                                placeholder="Max Price"
                                className="bg-transparent outline-none w-full text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            className="gth-btn-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* 🔥 MAIN LAYOUT (UNCHANGED STRUCTURE) */}
            <div className="flex flex-col md:flex-row flex-1">

                {/* SIDEBAR */}
                <aside className="w-full md:w-80 p-6 border-r border-white/10 flex flex-col bg-[#050505]">

                    <h2 className="font-bold mb-4 text-yellow-500 uppercase">
                        Filters
                    </h2>

                    <form className="space-y-3 mb-6" method="GET">

                        <input
                            name="minPrice"
                            defaultValue={params.minPrice || ""}
                            placeholder="Min Price"
                            className="w-full bg-[#111] p-3 rounded-lg"
                        />

                        <input
                            name="maxPrice"
                            defaultValue={params.maxPrice || ""}
                            placeholder="Max Price"
                            className="w-full bg-[#111] p-3 rounded-lg"
                        />

                        <select
                            name="category"
                            defaultValue={params.category || ""}
                            className="w-full bg-[#111] p-3 rounded-lg"
                        >
                            <option value="">All Categories</option>
                            <option value="adventure">Adventure</option>
                            <option value="luxury">Luxury</option>
                        </select>

                        <button className="gth-btn-gold w-full py-3 text-black font-bold rounded-lg">
                            Apply Filters
                        </button>
                    </form>

                    {/* ✅ MAP FIXED (NO mt-auto) */}
                    <div className="mt-4 sticky top-6">
                        <h3 className="text-xs text-gray-500 mb-2 uppercase">
                            Location View
                        </h3>

                        <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/10">
                            <MapWrapper data={sorted} />
                        </div>
                    </div>
                </aside>

                {/* MAIN GRID */}
                <main className="flex-1 overflow-y-auto p-6">

                    <h1 className="text-2xl font-black mb-6 uppercase">
                        Available Tours ({sorted.length})
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {sorted.map((tour, i) => (
                            <div
                                key={tour.id}
                                className="bg-[#0a0a0a] rounded-2xl p-5 group border border-white/5 hover:border-yellow-500 transition"
                            >
                                <div className="relative h-48 overflow-hidden rounded-xl">
                                    <img
                                        src={tour.image_url}
                                        className="w-full h-full object-cover group-hover:scale-110 transition"
                                    />

                                    {i === 0 && (
                                        <span className="absolute top-2 left-2 gth-btn-gold text-black text-xs px-2 py-1 rounded">
                                            BEST DEAL 🔥
                                        </span>
                                    )}
                                </div>

                                <h3 className="mt-4 font-bold">
                                    {tour.title}
                                </h3>

                                <p className="text-yellow-500 font-bold text-lg">
                                    {symbolMap[tour.currency] || "₹"}{tour.price_numeric ?? 0}
                                </p>

                                <a

                                    href={`/tours/${tour.city_slug}`}
                                    className="block mt-4 gth-glass/10 hover:gth-btn-gold hover:text-black text-white text-center py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all border border-white/10"
                                >
                                    View Details →

                                </a>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}