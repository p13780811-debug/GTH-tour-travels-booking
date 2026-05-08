"use client"

import {
    LayoutGrid,
    Sparkles,
    TrendingUp,
    Building2,
} from "lucide-react"

import PropertyCard from "./PropertyCard"

export default function PropertyGrid({
    properties,
    onSelect,
    onLead,
}: any) {

    return (
        <section className="relative w-full px-4 md:px-6 pb-10 md:pb-16 overflow-hidden">

            {/* ========================= */}
            {/* BACKGROUND GLOW */}
            {/* ========================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute top-0 left-[-120px] h-[260px] w-[260px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-0 right-[-120px] h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            {/* ========================= */}
            {/* TOP BAR */}
            {/* ========================= */}

            <div className="relative z-10 mb-8">

                <div className="gth-glass rounded-[32px] p-5 md:p-7 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                    {/* LEFT */}
                    <div>

                        <div className="flex items-center gap-3 mb-3">

                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">

                                <LayoutGrid size={24} />

                            </div>

                            <div>

                                <p className="text-[10px] uppercase tracking-[0.35em] opacity-60 font-black mb-1">
                                    GTH PRO ESTATE ENGINE
                                </p>

                                <h2 className="text-2xl md:text-4xl font-black tracking-[-0.04em] leading-none">

                                    Premium{" "}

                                    <span className="gold-text italic">
                                        Property Matrix
                                    </span>

                                </h2>
                            </div>
                        </div>

                        <p className="text-sm md:text-base opacity-70 max-w-2xl leading-7">
                            AI-ranked luxury listings optimized for visibility,
                            conversion, trust scoring & smart buyer engagement.
                        </p>
                    </div>

                    {/* RIGHT STATS */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">

                        <div className="min-w-[110px] rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[9px] uppercase tracking-[0.25em] opacity-60 font-black">
                                    Listings
                                </span>

                                <Building2 size={16} className="text-cyan-400" />
                            </div>

                            <h3 className="text-2xl font-black">
                                {properties?.length || 0}
                            </h3>

                            <p className="text-[11px] opacity-60 mt-1">
                                Live estates
                            </p>
                        </div>

                        <div className="min-w-[110px] rounded-[24px] border border-[var(--gold)]/20 bg-[var(--gold)]/10 p-4 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[9px] uppercase tracking-[0.25em] opacity-60 font-black">
                                    Premium
                                </span>

                                <Sparkles size={16} className="text-[var(--gold)]" />
                            </div>

                            <h3 className="text-2xl font-black gold-text">
                                AI
                            </h3>

                            <p className="text-[11px] opacity-60 mt-1">
                                Ranked
                            </p>
                        </div>

                        <div className="min-w-[110px] rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[9px] uppercase tracking-[0.25em] opacity-60 font-black">
                                    Growth
                                </span>

                                <TrendingUp size={16} className="text-emerald-400" />
                            </div>

                            <h3 className="text-2xl font-black">
                                +10X
                            </h3>

                            <p className="text-[11px] opacity-60 mt-1">
                                Visibility
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* EMPTY STATE */}
            {/* ========================= */}

            {properties?.length === 0 && (

                <div className="relative z-10">

                    <div className="gth-glass rounded-[36px] p-10 md:p-20 text-center border border-dashed border-white/10">

                        <div className="mx-auto h-20 w-20 rounded-[28px] flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_35px_rgba(212,175,55,0.35)] mb-6">

                            <Building2 size={34} />

                        </div>

                        <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4">

                            No Premium Listings

                        </h3>

                        <p className="max-w-xl mx-auto text-sm md:text-base opacity-60 leading-7">

                            Your filtered properties will appear here with AI ranking,
                            premium visibility & smart buyer targeting.

                        </p>
                    </div>
                </div>
            )}

            {/* ========================= */}
            {/* PROPERTY GRID */}
            {/* ========================= */}

            {properties?.length > 0 && (

                <div
                    className="
                        relative
                        z-10
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        2xl:grid-cols-3
                        gap-5
                        md:gap-7
                    "
                >

                    {properties.map((p: any, index: number) => (

                        <div
                            key={p.id}
                            className="
                                relative
                                animate-[fadeIn_.6s_ease]
                            "
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                animationFillMode: "both",
                            }}
                        >

                            {/* TOP AI LABEL */}
                            {index < 3 && (

                                <div className="absolute top-4 left-4 z-30 px-3 py-2 rounded-full border border-[var(--gold)]/20 bg-black/40 backdrop-blur-xl text-[10px] uppercase tracking-[0.25em] font-black text-[var(--gold)] shadow-[0_0_20px_rgba(212,175,55,0.2)]">

                                    AI TOP PICK

                                </div>
                            )}

                            {/* CARD */}
                            <PropertyCard
                                p={p}
                                onSelect={onSelect}
                                onLead={onLead}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}