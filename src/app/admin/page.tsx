"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        fetchBookings()
    }, [])

    async function fetchBookings() {
        setLoading(true)

        const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error(error)
        }

        if (data) {
            setBookings(data)
        }

        setLoading(false)
    }

    async function updateStatus(id: string, status: string) {
        setActionLoading(id)

        const { error } = await supabase
            .from("bookings")
            .update({ status })
            .eq("id", id)

        if (!error) {
            setBookings(prev =>
                prev.map(b => b.id === id ? { ...b, status } : b)
            )
        }

        setActionLoading(null)
    }

    async function deleteBooking(id: string) {
        setActionLoading(id)

        const { error } = await supabase
            .from("bookings")
            .delete()
            .eq("id", id)

        if (!error) {
            setBookings(prev => prev.filter(b => b.id !== id))
        }

        setActionLoading(null)
    }

    // 🔥 Better revenue logic
    const totalRevenue = bookings.reduce(
        (acc, b) => acc + (b.price || 0),
        0
    )

    return (
        <div className="min-h-screen bg-[#000d1a] text-white p-6 md:p-10">

            <h1 className="text-4xl font-black text-[#e6b800] mb-8">
                Admin Dashboard
            </h1>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">

                <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-sm">Total Bookings</p>
                    <h2 className="text-3xl font-bold mt-2">{bookings.length}</h2>
                </div>

                <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-sm">Revenue</p>
                    <h2 className="text-3xl font-bold text-green-400 mt-2">
                        ₹ {totalRevenue}
                    </h2>
                </div>

                <div className="bg-[#001a33] p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-sm">Pending</p>
                    <h2 className="text-3xl font-bold text-yellow-400 mt-2">
                        {bookings.filter(b => b.status !== "confirmed").length}
                    </h2>
                </div>

            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">
                    Loading bookings...
                </div>
            ) : (
                <div className="overflow-x-auto bg-[#001a33] rounded-2xl border border-slate-800">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-800 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Hotel</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {bookings.map((b) => (
                                <tr
                                    key={b.id}
                                    className="border-t border-slate-800 hover:bg-white/5 transition"
                                >
                                    <td className="p-4">{b.hotel_id}</td>
                                    <td className="p-4">{b.full_name}</td>

                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                            ${b.status === "confirmed"
                                                ? "bg-green-600/20 text-green-400"
                                                : "bg-yellow-600/20 text-yellow-400"
                                            }`}>
                                            {b.status}
                                        </span>
                                    </td>

                                    <td className="p-4 flex gap-2">

                                        <button
                                            disabled={actionLoading === b.id}
                                            onClick={() => updateStatus(b.id, "confirmed")}
                                            className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-sm disabled:opacity-50"
                                        >
                                            {actionLoading === b.id ? "..." : "Approve"}
                                        </button>

                                        <button
                                            disabled={actionLoading === b.id}
                                            onClick={() => deleteBooking(b.id)}
                                            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm disabled:opacity-50"
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