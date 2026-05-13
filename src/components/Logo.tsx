"use client"

import React from "react"

const GTHLogoMain = () => {
    return (
        <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer overflow-hidden transition-all duration-500 border border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/[0.06] hover:shadow-[0_0_35px_rgba(212,175,55,0.14)]">

            {/* ✨ Premium Glow Layer */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold-light)]/10" />

            {/* ✨ Shine Sweep */}
            <div className="absolute inset-y-0 -left-[120%] w-[60%] rotate-12 bg-white/10 blur-2xl group-hover:left-[140%] transition-all duration-1000" />

            {/* ========================= */}
            {/* 💎 ICON */}
            {/* ========================= */}

            <div className="relative z-10 shrink-0">
                <svg
                    width="50"
                    height="50"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-all duration-500 group-hover:scale-105 drop-shadow-[0_0_10px_rgba(212,175,55,0.18)] group-hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.45)]"
                >
                    <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--gold-dark)" />
                            <stop offset="50%" stopColor="var(--gold-light)" />
                            <stop offset="100%" stopColor="var(--gold)" />
                        </linearGradient>
                    </defs>

                    {/* OUTER SHIELD */}
                    <path
                        d="M50 10 L85 30 V70 L50 90 L15 70 V30 Z"
                        fill="rgba(255,255,255,0.03)"
                        stroke="url(#goldGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-90 transition-all duration-500"
                    />

                    {/* INNER G */}
                    <path
                        d="M65 40 
                           C60 35 55 33 50 33 
                           C38 33 30 42 30 52 
                           C30 62 38 71 50 71 
                           C60 71 65 65 65 58 
                           V52 H50"
                        fill="none"
                        stroke="url(#goldGrad)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="transition-all duration-500 group-hover:scale-105"
                    />
                </svg>
            </div>

            {/* ========================= */}
            {/* 🏆 BRAND TEXT */}
            {/* ========================= */}

            <div className="relative z-10 flex flex-col leading-none">

                {/* MAIN TITLE */}
                <h1 className="text-[18px] md:text-[22px] font-black tracking-[-0.04em] uppercase text-[var(--gold)] transition-all duration-500">

                    <span className="drop-shadow-[0_0_10px_rgba(212,175,55,0.22)] gth-btn">
                        GTH
                    </span>{" "}

                    <span className="italic bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold-light)] to-[var(--gold)] gold-text drop-shadow-[0_0_12px_rgba(212,175,55,0.18)] group-hover:brightness-110 transition-all duration-500">
                        PRO
                    </span>
                </h1>

                {/* SUBTEXT */}
                <p className="mt-1 text-[7px] md:text-[8px] font-bold uppercase tracking-[0.45em] text-[var(--gold)] opacity-80 group-hover:opacity-100 transition-all duration-500">
                    Global Luxury Platform
                </p>
            </div>
        </div>
    )
}

export default GTHLogoMain