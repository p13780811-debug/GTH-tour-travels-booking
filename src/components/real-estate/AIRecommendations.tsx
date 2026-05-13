"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, BrainCircuit, ArrowRight } from "lucide-react";
import PropertyCardPro from "./PropertyCardPro";

export default function AIRecommendations({ slug, user }: any) {

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {

            try {
                setLoading(true);

                const history = JSON.parse(
                    localStorage.getItem("viewed_props") || "[]"
                );

                const res = await fetch("/api/ai-recommend", {
                    method: "POST",
                    body: JSON.stringify({
                        slug,
                        history,
                    }),
                });

                const json = await res.json();

                setData(json || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [slug]);

    const handleSelect = (p: any) => {
        window.location.href = `/real-estate/${p.slug}`;
    };

    return (
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[var(--card)] p-5 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">

            {/* ========================= */}
            {/* 🔥 BACKGROUND GLOW */}
            {/* ========================= */}

            <div className="absolute inset-0 pointer-events-none overflow-hidden">

                <div className="absolute -top-24 right-[-80px] h-[260px] w-[260px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                <div className="absolute bottom-[-120px] left-[-60px] h-[220px] w-[220px] rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
            </div>

            {/* ========================= */}
            {/* ✨ HEADER */}
            {/* ========================= */}

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">

                {/* LEFT */}
                <div>

                    {/* TAG */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 mb-4">

                        <BrainCircuit size={14} className="text-[#d4af37]" />

                        <span className="text-[10px] uppercase tracking-[0.3em] font-black gold-text">
                            AI PROPERTY ENGINE
                        </span>
                    </div>

                    {/* TITLE */}
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-[var(--text)]">

                        Recommended{" "}

                        <span className="gold-text gold-text italic">
                            For You
                        </span>
                    </h2>

                    {/* SUBTEXT */}
                    <p className="mt-4 max-w-2xl text-sm md:text-base text-[var(--text)]/65 leading-relaxed">
                        Smart AI matching based on browsing history, user intent,
                        luxury preference, pricing behavior, and property engagement signals.
                    </p>
                </div>

                {/* RIGHT */}
                <div className="flex flex-wrap gap-3">

                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                        <Sparkles size={16} className="text-[#d4af37]" />

                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                Personalized
                            </p>

                            <p className="text-sm font-black">
                                AI Matched
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                        <TrendingUp size={16} className="text-cyan-400" />

                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                Conversion
                            </p>

                            <p className="text-sm font-black">
                                High Intent Leads
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* 🏠 PROPERTY LIST */}
            {/* ========================= */}

            {loading ? (

                <div className="relative z-10 flex gap-5 overflow-x-auto pb-3 no-scrollbar">

                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="min-w-[320px] h-[420px] rounded-[32px] border border-white/10 bg-white/[0.04] animate-pulse"
                        />
                    ))}
                </div>

            ) : data.length > 0 ? (

                <div className="relative z-10 flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">

                    {data.map((p) => (

                        <div
                            key={p.id}
                            className="group relative min-w-[320px] md:min-w-[360px] snap-start transition-all duration-500 hover:-translate-y-1"
                        >

                            {/* CARD GLOW */}
                            <div className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-all duration-500 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_65%)]" />

                            {/* AI BADGE */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-black/60 px-3 py-2 backdrop-blur-xl">

                                <Sparkles size={12} className="text-[#d4af37]" />

                                <span className="text-[10px] uppercase tracking-[0.25em] font-black gold-text">
                                    AI PICK
                                </span>
                            </div>

                            {/* PROPERTY CARD */}
                            <div className="relative z-10 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-500 group-hover:border-[#d4af37]/30 group-hover:shadow-[0_25px_60px_rgba(212,175,55,0.12)]">

                                <PropertyCardPro
                                    p={p}
                                    user={user}
                                    onSelect={handleSelect}
                                    onLead={() => { }}
                                    onBoost={() => { }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

            ) : (

                <div className="relative z-10 rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] py-20 text-center">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/10">

                        <BrainCircuit size={34} className="text-[#d4af37]" />
                    </div>

                    <h3 className="text-2xl font-black text-[var(--text)]">
                        No Recommendations Yet
                    </h3>

                    <p className="mt-3 text-sm text-[var(--text)]/60">
                        Explore more properties to unlock smarter AI recommendations
                    </p>
                </div>
            )}

            {/* ========================= */}
            {/* FOOTER */}
            {/* ========================= */}

            {!loading && data.length > 0 && (

                <div className="relative z-10 mt-8 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">

                    <div>

                        <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-black mb-1">
                            AI Recommendation Status
                        </p>

                        <h4 className="text-lg font-black text-[var(--text)]">
                            Dynamic Smart Matching Enabled
                        </h4>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-[#d4af37]">

                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                            Explore
                        </span>

                        <ArrowRight size={16} />
                    </div>
                </div>
            )}
        </section>
    );
}