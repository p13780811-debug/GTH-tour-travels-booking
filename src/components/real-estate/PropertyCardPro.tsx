"use client"

import { motion } from "framer-motion"
import {
    Crown,
    MapPin,
    Sparkles,
    ArrowUpRight,
    Heart,
    BedDouble,
    Bath,
    Maximize,
} from "lucide-react"
import { useThemeMode } from "@/lib/hooks/useThemeMode"

export default function PropertyCardPro({
    p,
    user,
    onSelect,
    onLead,
    onBoost,
}: any) {

    const theme = useThemeMode()
    const isDay = theme === "day"

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            whileHover={{ y: -6 }}
            onClick={() => onSelect(p)}
            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[var(--card)] text-[var(--text)] shadow-[0_15px_60px_rgba(0,0,0,0.18)] transition-all duration-500 cursor-pointer hover:border-[#d4af37]/30 hover:shadow-[0_25px_80px_rgba(212,175,55,0.12)]"
        >

            {/* ========================= */}
            {/* PREMIUM GLOW */}
            {/* ========================= */}

            <div className="absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 pointer-events-none">

                <div className="absolute top-[-120px] right-[-80px] h-[240px] w-[240px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                <div className="absolute bottom-[-120px] left-[-80px] h-[220px] w-[220px] rounded-full bg-cyan-500/10 blur-3xl" />

            </div>

            {/* ========================= */}
            {/* IMAGE */}
            {/* ========================= */}

            <div className="relative h-64 overflow-hidden">

                <img
                    src={p.image}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 select-none pointer-events-none"
                />

                {/* overlays */}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/0 via-transparent to-cyan-500/0 group-hover:from-[#d4af37]/10 group-hover:to-cyan-500/10 transition-all duration-700" />

                {/* top badges */}

                <div className="absolute top-4 left-4 flex items-center gap-2">

                    {p.is_featured && (
                        <div className="flex items-center gap-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                            <Crown size={12} />
                            Featured
                        </div>
                    )}

                    {p.type && (
                        <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                            {p.type}
                        </div>
                    )}

                </div>

                {/* favorite */}

                <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/35 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                >
                    <Heart size={18} />
                </button>

                {/* bottom price */}

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">

                    <div>

                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
                            Starting Price
                        </p>

                        <h2 className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-3xl font-black text-transparent drop-shadow-[0_0_18px_rgba(212,175,55,0.25)]">
                            ₹ {p.price} L
                        </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-xl transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:border-[#d4af37]/40 group-hover:text-[#d4af37]">
                        <ArrowUpRight size={20} />
                    </div>

                </div>
            </div>

            {/* ========================= */}
            {/* CONTENT */}
            {/* ========================= */}

            <div className="relative z-10 p-5">

                {/* title */}

                <div className="mb-4">

                    <h3 className="line-clamp-1 text-[22px] font-black tracking-tight">
                        {p.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-sm opacity-70">

                        <MapPin size={15} className="text-[#d4af37]" />

                        <span className="line-clamp-1">
                            {p.location}
                        </span>
                    </div>
                </div>

                {/* stats */}

                <div className="mb-5 grid grid-cols-3 gap-3">

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-xl transition-all duration-300 hover:border-[#d4af37]/20 hover:bg-[#d4af37]/[0.05]">

                        <BedDouble size={16} className="mx-auto mb-2 text-[#d4af37]" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                            Beds
                        </p>

                        <h4 className="mt-1 text-sm font-black">
                            {p.beds || "3"}
                        </h4>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/20 hover:bg-cyan-400/[0.05]">

                        <Bath size={16} className="mx-auto mb-2 text-cyan-400" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                            Baths
                        </p>

                        <h4 className="mt-1 text-sm font-black">
                            {p.baths || "2"}
                        </h4>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-xl transition-all duration-300 hover:border-purple-400/20 hover:bg-purple-400/[0.05]">

                        <Maximize size={16} className="mx-auto mb-2 text-purple-400" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                            Area
                        </p>

                        <h4 className="mt-1 text-sm font-black">
                            {p.area || "1800"}ft
                        </h4>
                    </div>

                </div>

                {/* footer */}

                <div className="flex items-center justify-between gap-3">

                    {/* trust badge */}

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl">

                        <Sparkles size={14} className="text-[#d4af37]" />

                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                            AI Verified
                        </span>
                    </div>

                    {/* actions */}

                    <div className="flex items-center gap-2">

                        {/* enquire */}

                        {user?.email !== p.created_by && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onLead(p.id)
                                }}
                                className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] p-[1px] transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <div className="rounded-2xl bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black">
                                    Enquire
                                </div>
                            </button>
                        )}

                        {/* boost */}

                        {user?.email === p.created_by && !p.is_featured && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onBoost(p.id)
                                }}
                                className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#d4af37] transition-all duration-300 hover:scale-105 hover:bg-[#d4af37] hover:text-black active:scale-95"
                            >
                                Boost
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </motion.div>
    )
}