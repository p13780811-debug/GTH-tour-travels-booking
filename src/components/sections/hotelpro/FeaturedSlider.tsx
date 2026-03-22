'use client'; // Next.js App Router ke liye zaroori hai

import { useEffect, useState } from 'react';
import { createClient } from "@supabase/supabase-js";

// Professional Way: Client ko component ke bahar rakhein taaki baar-baar render na ho
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


interface Destination {
    id: string | number;
    title: string;
    image_url: string;
    price?: string;
}

export default function FeaturedDestinations() {
    const [items, setItems] = useState<Destination[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getDestinations() {
            try {
                const { data, error } = await supabase.from('destinations').select('*');
                if (error) throw error;

                if (data) {
                    setItems([...data, ...data]); // Ab ye red line nahi dega!
                }
            } catch (err: any) {
                console.error("GTH Error:", err.message);
            } finally {
                setIsLoading(false);
            }
        }
        getDestinations();
    }, []);

    return (
        <div className="py-16 bg-black overflow-hidden perspective-1000">
            <div className="text-center mb-12">
                <h2 className="text-[#f59e0b] font-black tracking-[10px] uppercase text-3xl md:text-4xl">
                    Featured Destinations
                </h2>
                <div className="h-1 w-20 bg-[#f59e0b] mx-auto mt-4 shadow-[0_0_15px_#f59e0b]"></div>
            </div>

            {/* --- SCROLL CONTAINER --- */}
            <div className="flex gap-8 animate-luxury-scroll hover:pause-scroll px-4">
                {isLoading ? (
                    // 🚀 LOADING STATE: Jab tak data aa raha hai
                    Array.from({ length: 4 }).map((_, n) => (
                        <div key={n} className="min-w-[350px] h-[500px] bg-zinc-900/50 rounded-3xl animate-pulse border border-white/5 shadow-inner"></div>
                    ))
                ) : (
                    // ✅ DATA STATE: Jab data mil jaye
                    items.map((dest: any, index: number) => (
                        <div
                            key={index}
                            className="min-w-[350px] h-[500px] relative rounded-3xl overflow-hidden group border border-white/10 transition-all duration-700 hover:rotate-y-12 shadow-2xl"
                        >
                            <img src={dest.image_url} alt={dest.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-8">
                                <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">
                                    {dest.title}
                                </h3>
                                <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-4">
                                    <p className="text-white/70 text-xs tracking-widest uppercase">Explore More</p>
                                    <p className="text-[#f59e0b] font-bold">STARTING AT {dest.price || '₹25,000'}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 🔮 Luxury 3D Animation CSS Optimized */}
            <style jsx>{`
        @keyframes luxuryScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-luxury-scroll {
          display: flex;
          width: max-content;
          animation: luxuryScroll 40s linear infinite;
          will-change: transform; /* Smooth performance ke liye */
        }
        .hover\:pause-scroll:hover {
          animation-play-state: paused;
        }
        @media (max-width: 768px) {
          .animate-luxury-scroll {
            animation-duration: 25s; /* Mobile par thoda fast chale */
          }
        }
      `}</style>
        </div>
    );
}