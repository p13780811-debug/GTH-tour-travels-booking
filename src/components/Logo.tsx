"use client"

import React from 'react'

const GTHLogoMain = () => {
    return (
        <div className="flex items-center gap-3 cursor-pointer group">
            <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
            >
                <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#f2d06b" />
                    </linearGradient>
                </defs>

                {/* Diamond Shield - Forced string attributes for TS */}
                <path
                    d="M50 10 L85 30 V70 L50 90 L15 70 V30 Z"
                    fill="none"
                    stroke="url(#goldGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"

                    className="animate-pulse"
                />

                {/* Inner 'G' Symbol - Forced string attributes for TS */}
                <path
                    d="M65 40 C60 35 55 33 50 33 C38 33 30 42 30 52 C30 62 38 71 50 71 C60 71 65 65 65 58 V52 H50"
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="5"
                    strokeLinecap="round"

                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                />
            </svg>

            {/* Brand Text */}
            <div className="flex flex-col leading-tight">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter">
                    GTH <span className="text-[#d4af37]">LUXURY</span>
                </h1>
                <p className="text-[8px] md:text-[10px] font-bold text-[#d4af37] tracking-[0.4em] uppercase">
                    Pro Exclusive
                </p>
            </div>
        </div>
    )
}

export default GTHLogoMain