"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import {
    Sparkles,
    Mail,
    ArrowRight,
    ShieldCheck,
    Crown,
    Zap,
    X,
} from "lucide-react"

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
                    emailRedirectTo: `${window.location.origin}/real-estate`,
                },
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
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">

            {/* ========================= */}
            {/* MAIN MODAL */}
            {/* ========================= */}

            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[var(--card)] text-[var(--text)] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">

                {/* ========================= */}
                {/* BACKGROUND GLOW */}
                {/* ========================= */}

                <div className="absolute inset-0 pointer-events-none overflow-hidden">

                    <div className="absolute top-[-120px] right-[-80px] h-[260px] w-[260px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                    <div className="absolute bottom-[-120px] left-[-80px] h-[220px] w-[220px] rounded-full bg-cyan-500/10 blur-3xl" />

                </div>

                {/* ========================= */}
                {/* HEADER */}
                {/* ========================= */}

                <div className="relative z-10 p-6 md:p-8 border-b border-white/10">

                    <div className="flex items-start justify-between gap-4">

                        <div className="flex items-center gap-4">

                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                <Crown size={24} />
                            </div>

                            <div>

                                <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                                    GTH{" "}

                                    <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent italic">
                                        PRIME ACCESS
                                    </span>
                                </h2>

                                <p className="mt-2 text-[10px] uppercase tracking-[0.35em] opacity-60 font-bold">
                                    Luxury Real Estate Portal
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* FEATURES */}

                    <div className="grid grid-cols-3 gap-3 mt-6">

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                            <ShieldCheck size={18} className="mx-auto mb-2 text-cyan-400" />
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-70">
                                Secure
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                            <Zap size={18} className="mx-auto mb-2 text-yellow-400" />
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-70">
                                Fast Access
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                            <Sparkles size={18} className="mx-auto mb-2 text-[#d4af37]" />
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-70">
                                Premium Tools
                            </p>
                        </div>

                    </div>
                </div>

                {/* ========================= */}
                {/* BODY */}
                {/* ========================= */}

                <div className="relative z-10 p-6 md:p-8">

                    {/* EMAIL FIELD */}

                    <div className="mb-5">

                        <label className="block mb-2 text-[11px] uppercase tracking-[0.25em] font-bold opacity-70">
                            Email Address
                        </label>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 transition-all duration-300 focus-within:border-[#d4af37]/40 focus-within:bg-[#d4af37]/[0.04]">

                            <Mail size={18} className="opacity-60" />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* LOGIN BUTTON */}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] p-[1px] transition-all duration-500 hover:scale-[1.01] active:scale-95"
                    >
                        <div className="flex items-center justify-center gap-3 rounded-2xl px-5 py-4 font-black uppercase tracking-[0.22em] text-black bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]">

                            <span>
                                {loading ? "Sending Magic Link..." : "Continue Securely"}
                            </span>

                            {!loading && (
                                <ArrowRight
                                    size={18}
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                />
                            )}
                        </div>
                    </button>

                    {/* SUCCESS */}

                    {message && (
                        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                            {message}
                        </div>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* FOOTER */}

                    <div className="mt-6 flex items-center justify-center gap-2 text-center">

                        <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />

                        <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-bold">
                            Passwordless Luxury Authentication
                        </p>

                    </div>
                </div>
            </div>
        </div>
    )
}