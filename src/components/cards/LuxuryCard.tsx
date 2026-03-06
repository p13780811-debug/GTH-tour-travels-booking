"use client"
import Link from 'next/link'

interface CardProps {
    title: string;
    description?: string;
    price?: string;
    image?: string;
    slug: string;
}

// Function name ko LuxuryCard kar dijiye taki page.tsx se match kare
export default function LuxuryCard({ title, description, price, image, slug }: CardProps) {
    return (
        <div className="relative group overflow-hidden rounded-3xl bg-[#1a1a1a] border border-white/5 hover:border-yellow-500/50 transition-all duration-500 shadow-2xl">
            {/* Image Section */}
            <div className="relative h-[400px] w-full">
                <img
                    src={image || "/images/placeholder.jpg"}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <h3 className="absolute top-6 left-6 text-2xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                    {title}
                </h3>
            </div>

            {/* Content Section */}
            <div className="absolute bottom-0 left-0 right-0 p-6 backdrop-blur-md bg-black/40 border-t border-white/10">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Starting From</p>
                        <p className="text-yellow-500 text-xl font-black">₹{price || "4,999"}</p>
                    </div>

                    {/* YAHAN ASLI LINK CONNECT KIYA - site reachable error hatane ke liye */}
                    <Link href={`/destinations/${slug}`}>
                        <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                            VIEW →
                        </button>
                    </Link>
                </div>

                {/* 1% Education Fund Tracker [cite: 2026-02-17, 2026-02-20] */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <span className="text-[10px] text-gray-400 font-medium">1% goes to Children's Education Fund 💛</span>
                </div>
            </div>
        </div>
    )
}