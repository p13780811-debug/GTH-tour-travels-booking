"use client"

import { useState } from "react"

export default function BookingSection() {
    const [open, setOpen] = useState(false)

    return (
        <div className="max-w-6xl mx-auto px-6 py-20">

            <button
                onClick={() => setOpen(true)}
                className="px-6 py-3 bg-yellow-500 text-black rounded-xl font-semibold"
            >
                Request Booking
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] p-8 rounded-2xl w-[90%] max-w-md">
                        <h2 className="text-2xl mb-6 text-yellow-400 font-bold">
                            Booking Request
                        </h2>

                        <input
                            type="text"
                            placeholder="Your Name"
                            className="w-full mb-4 p-3 rounded-lg bg-black border border-gray-600"
                        />

                        <input
                            type="date"
                            className="w-full mb-4 p-3 rounded-lg bg-black border border-gray-600"
                        />

                        <button className="w-full py-3 bg-yellow-500 text-black font-semibold rounded-xl">
                            Submit Request
                        </button>

                        <button
                            onClick={() => setOpen(false)}
                            className="mt-4 text-gray-400 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}