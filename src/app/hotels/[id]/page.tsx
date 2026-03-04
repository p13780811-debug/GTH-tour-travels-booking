"use client"

import { hotels } from "@/data/hotels"
import { notFound } from "next/navigation"
import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function HotelDetail() {
    const params = useParams()
    const id = params?.id as string

    const hotel = hotels.find((h) => h.id === id)
    const [open, setOpen] = useState(false)

    if (!hotel) return notFound()

    const similarHotels = hotels.filter((h) => h.id !== hotel.id)

    return (
        <div className="bg-[#0f0f0f] text-white min-h-screen">

            {/* HERO SLIDER */}
            <div className="relative h-[80vh] overflow-hidden">
                <div className="flex w-full h-full overflow-x-auto scroll-smooth snap-x snap-mandatory">
                    {hotel.images.map((img, index) => (
                        <div key={index} className="min-w-full h-full snap-center relative">
                            <img
                                src={img}
                                alt={hotel.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50"></div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-20 left-10 z-10">
                    <h1 className="text-4xl md:text-6xl font-bold text-yellow-400">
                        {hotel.name}
                    </h1>
                    <p className="text-gray-300 mt-3 text-lg">
                        {hotel.location}
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-3 gap-16">

                    {/* LEFT SIDE */}
                    <div className="lg:col-span-2 space-y-20">

                        {/* ABOUT */}
                        <section>
                            <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
                                About The Property
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                {hotel.description}
                            </p>
                        </section>

                        {/* AMENITIES */}
                        <section>
                            <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
                                Amenities
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                {hotel.amenities.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#1a1a1a] border border-yellow-500/20 px-6 py-4 rounded-xl text-gray-300"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* REVIEWS */}
                        <section>
                            <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
                                Guest Reviews
                            </h2>

                            <div className="space-y-6">
                                {hotel.reviews.map((review, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#1a1a1a] border border-yellow-500/20 p-6 rounded-xl"
                                    >
                                        <div className="flex text-yellow-400 mb-2">
                                            ★★★★★
                                        </div>
                                        <p className="text-gray-300 mb-4">
                                            "{review.comment}"
                                        </p>
                                        <p className="text-yellow-400 font-semibold">
                                            — {review.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SIMILAR HOTELS */}
                        {similarHotels.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
                                    Similar Hotels
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {similarHotels.map((h) => (
                                        <Link
                                            key={h.id}
                                            href={`/hotels/${h.id}`}
                                            className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-yellow-500/20 hover:scale-105 transition"
                                        >
                                            <img
                                                src={h.images[0]}
                                                className="h-48 w-full object-cover"
                                            />
                                            <div className="p-4">
                                                <h3 className="text-yellow-400 font-semibold">
                                                    {h.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    {h.location}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="sticky top-32 h-fit">
                        <div className="bg-[#1a1a1a] border border-yellow-500/20 rounded-2xl p-8 space-y-6 shadow-xl">

                            <div className="text-3xl font-bold text-yellow-400">
                                {hotel.price}
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="date"
                                    className="w-full bg-black border border-yellow-500/20 rounded-lg p-3 text-gray-300"
                                />
                                <input
                                    type="date"
                                    className="w-full bg-black border border-yellow-500/20 rounded-lg p-3 text-gray-300"
                                />
                                <select className="w-full bg-black border border-yellow-500/20 rounded-lg p-3 text-gray-300">
                                    <option>1 Guest</option>
                                    <option>2 Guests</option>
                                    <option>3 Guests</option>
                                    <option>4 Guests</option>
                                </select>
                            </div>

                            <button
                                onClick={async () => {
                                    await fetch("/api/bookings", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            hotel_id: hotel.id,
                                            full_name: "Test User",
                                            email: "test@example.com",
                                            checkin: "2025-01-01",
                                            checkout: "2025-01-05",
                                            guests: 2,
                                        }),
                                    })
                                    alert("Booking Request Sent!")
                                    setOpen(false)
                                }}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-xl"
                            >
                                Submit Request
                            </button>

                        </div>
                    </div>

                </div>
            </div>

            {/* BOOKING MODAL */}
            {open && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] p-10 rounded-2xl w-[90%] max-w-lg space-y-6">

                        <h2 className="text-2xl font-bold text-yellow-400">
                            Book Your Stay
                        </h2>

                        <input
                            placeholder="Full Name"
                            className="w-full bg-black border border-yellow-500/20 rounded-lg p-3 text-gray-300"
                        />

                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-black border border-yellow-500/20 rounded-lg p-3 text-gray-300"
                        />

                        <button className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-xl">
                            Submit Request
                        </button>

                        <button
                            onClick={() => setOpen(false)}
                            className="text-gray-400 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                const res = await fetch("/api/bookings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        hotel_id: hotel.id,
                                        full_name: "Raj",
                                        email: "test@test.com",
                                        checkin: "2025-01-01",
                                        checkout: "2025-01-05",
                                        guests: 2,
                                    }),
                                })

                                const data = await res.json()
                                console.log(data)
                                alert("Booking Sent")
                            }}
                            className="bg-yellow-500 px-4 py-2 text-black"
                        >
                            TEST BOOKING
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}