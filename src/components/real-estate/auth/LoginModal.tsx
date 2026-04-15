"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import styles from "@/app/real-estate/RealEstate.module.css"

export default function LoginModal({ onClose }: any) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleLogin = async () => {
        if (!email) {
            setError("Enter email first")
            return
        }

        try {
            setLoading(true)
            setError("")
            setMessage("")

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/real-estate`
                }
            })

            if (error) throw error

            setMessage("📩 Magic link sent! Check your email")

        } catch (err: any) {
            setError(err.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">

            <div className={`${styles.glassCard} w-[400px]`}>

                <h2 className="text-lg font-semibold mb-2">
                    Login / Register
                </h2>

                <p className="text-sm text-gray-400 mb-4">
                    Access dashboard, leads & premium tools
                </p>

                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full mb-3 p-3 rounded bg-black/40 border border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black p-3 rounded font-bold"
                >
                    {loading ? "Sending..." : "Send Magic Link"}
                </button>

                {message && (
                    <p className="text-green-400 text-sm mt-3 text-center">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="text-red-400 text-sm mt-3 text-center">
                        {error}
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