"use client"

import { useState } from "react"

export default function AddPropertyModal({ onSave, onClose }: any) {
    const [form, setForm] = useState<any>({})
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSave = async () => {
        if (!form.title || !form.location || !form.price || !form.image) {
            setError("⚠️ All fields are required")
            return
        }

        try {
            setError("")
            setLoading(true)

            await onSave(form)

            setSuccess(true)

            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 1500)

        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 w-96 rounded-xl">

                <h2 className="font-bold mb-4">Add Property</h2>

                {["title", "location", "price", "image"].map((f) => (
                    <input
                        key={f}
                        placeholder={f}
                        className="border p-2 w-full mb-2 rounded"
                        onChange={(e) =>
                            setForm({ ...form, [f]: e.target.value })
                        }
                    />
                ))}

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                {success && <p className="text-green-600 text-sm mb-2">✅ Added</p>}

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded w-full"
                >
                    {loading ? "Saving..." : "Save Asset"}
                </button>

                <button onClick={onClose} className="mt-2 text-sm">
                    Cancel
                </button>
            </div>
        </div>
    )
}