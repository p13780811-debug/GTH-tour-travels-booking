"use client";

import React from "react";

export default function GlassSlider({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full overflow-hidden py-10 [perspective:2000px]">
            {/* 🚀 Ye hai wo Main Source jo animation control karta hai */}
            <div className="flex gap-10 animate-premium-scroll hover:[animation-play-state:paused] px-4">
                {/* Children ka matlab: Jo bhi card tum iske andar phenkoge */}
                {[children, children].map((item, index) => (
                    <div key={index} className="flex gap-10">
                        {item}
                    </div>
                ))}
            </div>

            <style jsx>{`
        @keyframes premiumScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-premium-scroll {
          display: flex;
          width: max-content;
          animation: premiumScroll 80s linear infinite;
          transform-style: preserve-3d;
        }
        /* 💎 Yahan se apply hota hai wo 3D Effect bina card ko chhede */
        .animate-premium-scroll :global(a), 
        .animate-premium-scroll :global(.card-item) {
          transform: rotateY(-15deg);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .animate-premium-scroll :global(a:hover) {
          transform: rotateY(0deg) scale(1.05) translateZ(50px);
          z-index: 50;
        }
      `}</style>
        </div>
    );
}