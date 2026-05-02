"use client"

import { useState } from "react"

type OwnerHotel = { name: string; city: string; price: string; image: string }

export default function OwnersPage() {
    const [hotels, setHotels] = useState<OwnerHotel[]>([])
    const [form, setForm] = useState({ name: "", city: "", price: "", image: "" })

    function handleAdd() {
        if (!form.name || !form.city) return
        setHotels([...hotels, form])
        setForm({ name: "", city: "", price: "", image: "" })
    }

    return (
        <div className="bg-black text-white min-h-screen p-10">
            <h1 className="text-3xl text-yellow-400 font-bold mb-6">
                Add Your Hotel
            </h1>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
                <input
                    placeholder="Hotel Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="p-3 rounded w-full text-black"
                />
                <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="p-3 rounded w-full text-black"
                />
                <input
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="p-3 rounded w-full text-black"
                />
                <input
                    placeholder="Image URL"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="p-3 rounded w-full text-black"
                />
                <button
                    onClick={handleAdd}
                    className="gth-btn-gold text-black px-4 py-3 rounded font-bold"
                >
                    Add Hotel
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hotels.map((h, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
                        <img src={h.image || "/hotel-placeholder.jpg"} className="h-60 w-full object-cover" />
                        <div className="p-5">
                            <h2 className="text-xl font-semibold text-yellow-400">{h.name}</h2>
                            <p className="text-gray-400">{h.city}</p>
                            <div className="text-yellow-400 font-bold">₹{h.price}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}