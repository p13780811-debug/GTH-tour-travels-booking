"use client"

import { useState } from "react"
import { Search, MapPin, Mic } from "lucide-react"

export default function MobileRealEstate() {

    const [query, setQuery] = useState("")

    const categories = [
        { title: "Buy", icon: "🏠" },
        { title: "Rent", icon: "🏢" },
        { title: "Commercial", icon: "🏬" },
        { title: "Luxury", icon: "💎" },
    ]

    const properties = Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        title: "2BHK Luxury Apartment",
        price: "₹45L",
        location: "Mumbai",
        img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"
    }))

    const handleSearch = () => {
        if (!query.trim()) return
        alert("Searching: " + query)
    }

    return (
        <div className="gth-layout text-white pb-24">

            {/* ================= HERO ================= */}
            <div className="relative h-[260px] flex flex-col justify-end p-4">

                {/* BG */}
                <img
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/70" />

                {/* TITLE */}
                <h1 className="relative text-xl font-bold mb-3">
                    Find your dream home
                </h1>

                {/* SEARCH */}
                <div className="relative gth-glass flex items-center gap-2 p-2">

                    <Search size={16} />

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city, budget..."
                        className="flex-1 bg-transparent outline-none text-sm"
                    />

                    <MapPin size={18} className="cursor-pointer" />
                    <Mic size={18} className="cursor-pointer" />

                    <button
                        onClick={handleSearch}
                        className="bg-[var(--gold)] text-black px-3 py-1 rounded text-xs font-bold"
                    >
                        Go
                    </button>

                </div>

            </div>

            {/* ================= CATEGORIES ================= */}
            <div className="mt-4">

                <h2 className="px-4 text-sm mb-2 text-secondary">
                    Categories
                </h2>

                <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">

                    {categories.map((c, i) => (
                        <div
                            key={i}
                            className="min-w-[100px] gth-glass gth-hover p-3 rounded-xl text-center"
                        >
                            <div className="text-2xl">{c.icon}</div>
                            <div className="text-xs mt-1">{c.title}</div>
                        </div>
                    ))}

                </div>

            </div>

            {/* ================= FEATURED ================= */}
            <div className="mt-6">

                <h2 className="px-4 text-sm mb-2 text-secondary">
                    Featured Properties
                </h2>

                <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">

                    {properties.map((p) => (
                        <div key={p.id} className="min-w-[240px]">

                            <div className="gth-glass rounded-xl overflow-hidden">

                                <img src={p.img} className="h-32 w-full object-cover" />

                                <div className="p-3">

                                    <h3 className="text-sm font-bold">{p.title}</h3>

                                    <p className="text-xs text-secondary">
                                        {p.location}
                                    </p>

                                    <p className="text-sm mt-1 text-[var(--gold)] font-bold">
                                        {p.price}
                                    </p>

                                </div>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

            {/* ================= RECOMMENDED ================= */}
            <div className="mt-6">

                <h2 className="px-4 text-sm mb-2 text-secondary">
                    Recommended
                </h2>

                <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">

                    {properties.map((p) => (
                        <div key={p.id} className="min-w-[240px]">

                            <div className="gth-glass rounded-xl overflow-hidden">

                                <img src={p.img} className="h-32 w-full object-cover" />

                                <div className="p-3">

                                    <h3 className="text-sm font-bold">{p.title}</h3>

                                    <p className="text-xs text-secondary">
                                        {p.location}
                                    </p>

                                    <p className="text-sm mt-1 text-[var(--gold)] font-bold">
                                        {p.price}
                                    </p>

                                </div>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

            {/* ================= BOTTOM NAV ================= */}
            <div className="fixed bottom-0 left-0 w-full gth-glass flex justify-around p-3">

                <button className="text-xs">🏠 Home</button>
                <button className="text-xs">🔍 Search</button>
                <button className="text-xs">❤️ Saved</button>
                <button className="text-xs">👤 Profile</button>

            </div>

        </div>
    )
}