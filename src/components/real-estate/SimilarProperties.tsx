"use client"

import { useEffect, useState } from "react"
import {
    Sparkles,
    ChevronRight,
    Building2,
    Crown,
    Radar,
} from "lucide-react"

import PropertyCardPro from "./PropertyCardPro"

export default function SimilarProperties({ slug, user }: any) {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const res = await fetch(`/api/similar?slug=${slug}`)
            const json = await res.json()
            setData(json || [])
        }

        load()
    }, [slug])

    const handleSelect = (p: any) => {
        window.location.href = `/real-estate/${p.slug}`
    }

    const handleLead = (id: number) => {
        console.log("Lead sent:", id)
    }

    const handleBoost = (id: number) => {
        alert("Boost clicked for " + id)
    }

    return (
        <section className="relative mt-10">

            {/* ========================= */}
            {/* 💎 WRAPPER */}
            {/* ========================= */}

            <div className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--card)] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.12)]">

                {/* ========================= */}
                {/* ✨ BACKGROUND FX */}
                {/* ========================= */}

                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                    <div className="absolute top-[-120px] right-[-100px] h-[260px] w-[260px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                    <div className="absolute bottom-[-120px] left-[-100px] h-[240px] w-[240px] rounded-full bg-cyan-500/10 blur-3xl" />

                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,var(--text)_1px,transparent_1px)] [background-size:24px_24px]" />
                </div>

                {/* ========================= */}
                {/* 🏆 HEADER */}
                {/* ========================= */}

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-[var(--border)] px-5 md:px-8 py-6">

                    {/* LEFT */}
                    <div className="flex items-center gap-4">

                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                            <Radar size={26} />
                        </div>

                        <div>

                            <div className="flex items-center gap-2 mb-2">

                                <span className="px-3 py-1 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gold)]">
                                    AI MATCHING ENGINE
                                </span>

                                <span className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card-soft)] text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text)]">
                                    LIVE RECOMMENDATIONS
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none text-[var(--text)]">

                                Similar{" "}

                                <span className="italic bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent">
                                    Premium Properties
                                </span>

                            </h2>

                            <p className="mt-2 text-sm opacity-70 max-w-2xl leading-relaxed">
                                AI curated luxury properties matching location,
                                pricing, architecture style, buyer intent, and
                                premium engagement patterns.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="grid grid-cols-2 gap-3">

                        <div className="min-w-[130px] rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] px-4 py-4">

                            <div className="flex items-center justify-between mb-2">

                                <span className="text-[10px] uppercase tracking-[0.22em] font-black opacity-60">
                                    Matches
                                </span>

                                <Building2 size={16} className="text-cyan-400" />
                            </div>

                            <h3 className="text-2xl font-black">
                                {data.length}
                            </h3>

                            <p className="text-xs opacity-60 mt-1">
                                Similar listings
                            </p>
                        </div>

                        <div className="min-w-[130px] rounded-2xl border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold)]/10 to-transparent px-4 py-4">

                            <div className="flex items-center justify-between mb-2">

                                <span className="text-[10px] uppercase tracking-[0.22em] font-black opacity-60">
                                    Premium
                                </span>

                                <Crown size={16} className="text-[var(--gold)]" />
                            </div>

                            <h3 className="text-2xl font-black">
                                AI+
                            </h3>

                            <p className="text-xs opacity-60 mt-1">
                                Luxury ranking
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================= */}
                {/* 🏘 PROPERTY STRIP */}
                {/* ========================= */}

                <div className="relative z-10 px-5 md:px-8 py-7">

                    {data.length > 0 ? (

                        <div className="relative">

                            {/* LEFT FADE */}
                            <div className="absolute left-0 top-0 z-20 h-full w-14 bg-gradient-to-r from-[var(--card)] to-transparent pointer-events-none" />

                            {/* RIGHT FADE */}
                            <div className="absolute right-0 top-0 z-20 h-full w-14 bg-gradient-to-l from-[var(--card)] to-transparent pointer-events-none" />

                            {/* SCROLL ROW */}
                            <div className="flex gap-6 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory scroll-smooth">

                                {data.map((p, i) => (

                                    <div
                                        key={p.id}
                                        className="relative min-w-[320px] max-w-[320px] snap-start"
                                    >

                                        {/* FLOATING BADGE */}
                                        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full border border-[var(--gold)]/20 bg-black/40 backdrop-blur-xl px-3 py-1.5">

                                            <Sparkles size={12} className="text-[var(--gold)]" />

                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                Match #{i + 1}
                                            </span>
                                        </div>

                                        <PropertyCardPro
                                            p={p}
                                            user={user}
                                            onSelect={handleSelect}
                                            onLead={handleLead}
                                            onBoost={handleBoost}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                    ) : (

                        <div className="relative overflow-hidden rounded-[30px] border border-dashed border-[var(--border)] bg-[var(--card-soft)] py-24 text-center">

                            {/* BG FX */}
                            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--text)_1px,transparent_1px)] [background-size:20px_20px]" />

                            <div className="relative z-10 flex flex-col items-center">

                                <div className="h-20 w-20 rounded-[28px] flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_40px_rgba(212,175,55,0.25)] mb-6">
                                    <Sparkles size={34} />
                                </div>

                                <h3 className="text-3xl font-black tracking-tight text-[var(--text)]">
                                    No Similar Properties Yet
                                </h3>

                                <p className="mt-3 text-sm opacity-65 max-w-md leading-relaxed">
                                    Our AI engine is still scanning premium
                                    listings to find highly relevant luxury
                                    property matches.
                                </p>

                                <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 px-5 py-2">

                                    <Sparkles size={14} className="text-[var(--gold)]" />

                                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">
                                        AI SEARCH ACTIVE
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========================= */}
                {/* 🧠 FOOTER */}
                {/* ========================= */}

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-[var(--border)] px-5 md:px-8 py-5">

                    <div>

                        <p className="text-[10px] uppercase tracking-[0.32em] font-black opacity-60 mb-2">
                            GTH PRO RECOMMENDATION MATRIX
                        </p>

                        <p className="text-sm opacity-70 leading-relaxed">
                            Smart recommendations evolve dynamically based on
                            engagement, pricing trends, buyer activity, and
                            premium property intelligence.
                        </p>
                    </div>

                    <button className="group flex items-center justify-center gap-3 rounded-2xl border border-[var(--gold)]/20 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-6 py-4 text-black font-black uppercase tracking-[0.18em] text-xs transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.25)]">

                        Explore More

                        <ChevronRight
                            size={16}
                            className="transition-all duration-300 group-hover:translate-x-1"
                        />
                    </button>
                </div>
            </div>
        </section>
    )
}