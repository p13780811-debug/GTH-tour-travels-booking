"use client";

import { Rocket, Crown, Sparkles, TrendingUp } from "lucide-react";

export default function PremiumBoostBanner({ slug }: any) {

    const handleBoost = async () => {
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                body: JSON.stringify({ slug }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            alert("Payment failed");
        }
    };

    return (
        <div className="relative overflow-hidden rounded-[32px] border border-[#d4af37]/20 bg-[var(--card)] p-6 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">

            {/* 🔥 BACKGROUND GLOW */}
            <div className="absolute inset-0 pointer-events-none">

                <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#d4af37]/10 blur-3xl" />

                <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
            </div>

            {/* ✨ SHINE */}
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] animate-[shine_6s_linear_infinite]" />

            {/* CONTENT */}
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

                {/* LEFT */}
                <div className="flex items-start gap-5">

                    {/* ICON */}
                    <div className="h-16 w-16 rounded-[24px] flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">

                        <Rocket size={28} />
                    </div>

                    {/* TEXT */}
                    <div>

                        {/* TOP TAG */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 mb-4">

                            <Sparkles size={12} className="text-[#d4af37]" />

                            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
                                Premium Visibility Engine
                            </span>
                        </div>

                        {/* TITLE */}
                        <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-none text-[var(--text)]">

                            Boost Your{" "}

                            <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent italic">
                                Property
                            </span>
                        </h3>

                        {/* DESCRIPTION */}
                        <p className="mt-4 text-sm md:text-base text-[var(--text)]/70 max-w-2xl leading-relaxed">
                            Rank higher in listings, dominate search visibility, attract premium buyers,
                            and generate faster conversions with AI-powered featured placement.
                        </p>

                        {/* FEATURES */}
                        <div className="mt-5 flex flex-wrap gap-3">

                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em]">
                                <TrendingUp size={14} className="text-cyan-400" />
                                10x Reach
                            </div>

                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em]">
                                <Crown size={14} className="text-yellow-400" />
                                Featured Listing
                            </div>

                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em]">
                                <Rocket size={14} className="text-[#d4af37]" />
                                Faster Leads
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-stretch md:items-end gap-4">

                    {/* PRICE */}
                    <div className="text-center md:text-right">

                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-black mb-2">
                            Premium Activation
                        </p>

                        <div className="flex items-end justify-center md:justify-end gap-1">

                            <span className="text-5xl font-black bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent">
                                ₹199
                            </span>

                            <span className="text-sm opacity-60 mb-2">
                                / boost
                            </span>
                        </div>
                    </div>

                    {/* BUTTON */}
                    <button
                        onClick={handleBoost}
                        className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-8 py-4 text-sm font-black uppercase tracking-[0.25em] text-black transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] active:scale-95"
                    >

                        {/* BUTTON SHINE */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)]" />

                        <div className="relative z-10 flex items-center justify-center gap-3">

                            <Rocket size={18} />

                            Boost Now
                        </div>
                    </button>

                    {/* TRUST TEXT */}
                    <p className="text-[11px] text-center md:text-right uppercase tracking-[0.2em] text-[var(--text)]/45 font-bold">
                        AI Ranked • Priority Placement • Verified Visibility
                    </p>
                </div>
            </div>
        </div>
    );
}