"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBookings()
    }, [])

    async function fetchBookings() {
        const { data } = await supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false })

        if (data) {
            setBookings(data)
        }

        setLoading(false)
    }

    async function updateStatus(id: string, status: string) {
        await supabase.from("bookings").update({ status }).eq("id", id)
        fetchBookings()
    }

    async function deleteBooking(id: string) {
        await supabase.from("bookings").delete().eq("id", id)
        fetchBookings()
    }

    const totalRevenue = bookings.length * 5000

    return (
        <div className="min-h-screen bg-black text-white p-10">
            <h1 className="text-4xl font-bold text-yellow-400 mb-8">
                Admin Dashboard
            </h1>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-[#1a1a1a] p-6 rounded-xl">
                    <p>Total Bookings</p>
                    <h2 className="text-2xl font-bold">{bookings.length}</h2>
                </div>

                <div className="bg-[#1a1a1a] p-6 rounded-xl">
                    <p>Estimated Revenue</p>
                    <h2 className="text-2xl font-bold text-green-400">
                        ₹ {totalRevenue}
                    </h2>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1a1a1a]">
                            <tr>
                                <th className="p-4">Hotel</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id} className="border-t border-gray-700">
                                    <td className="p-4">{b.hotel_id}</td>
                                    <td className="p-4">{b.full_name}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${b.status === "confirmed"
                                                ? "bg-green-600"
                                                : "bg-yellow-600"
                                            }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <button
                                            onClick={() => updateStatus(b.id, "confirmed")}
                                            className="bg-green-500 px-3 py-1 rounded"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => deleteBooking(b.id)}
                                            className="bg-red-500 px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}