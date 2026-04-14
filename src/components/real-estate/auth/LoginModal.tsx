"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginModal({ onClose }: any) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleLogin = async () => {
        if (!email) {
            setMessage("Enter email first")
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithOtp({
            email
        })

        if (error) {
            setMessage("Login failed")
        } else {
            setMessage("Check your email for login link 🚀")
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div className="bg-white text-black p-6 w-[400px] rounded-2xl shadow-xl">

                <h2 className="text-xl font-bold mb-2">
                    Login / Register
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Access dashboard, leads & boost features
                </p>

                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border p-3 rounded mb-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-cyan-500 text-black p-3 rounded font-bold"
                >
                    {loading ? "Sending..." : "Send Login Link"}
                </button>

                {message && (
                    <p className="text-sm mt-3 text-center text-gray-600">
                        {message}
                    </p>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 text-sm text-gray-500 w-full"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}