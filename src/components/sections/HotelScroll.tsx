"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function HotelScroll({ city }: { city?: string }) {
    const [liveHotels, setLiveHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHotels() {
            try {
                const queryCity = city || "Goa";
                const res = await fetch(`/api/hotels?city=${queryCity}`);
                const data = await res.json();
                setLiveHotels(data);
            } catch (error) {
                console.error("Hotel fetch failed", error);
            } finally {
                setLoading(false);
            }
        }
        loadHotels();
    }, [city]);

    if (loading) return (
        <div className="py-20 text-center text-white font-black animate-pulse uppercase tracking-[1em] text-[10px]">
            Unveiling Elite Stays...
        </div>
    );

    return (
        <section className="py-16 bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header: More Compact */}
                <div className="flex flex-col mb-10">
                    <span className="text-skyBlue text-[9px] font-black tracking-[0.5em] uppercase mb-2">Luxury Accommodations</span>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter leading-none">
                        {city ? `${city}` : "Special"} <span className="text-white/20 font-light">Collection</span>
                    </h2>
                </div>

                {/* Sleek Horizontal Scroll */}
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10 pt-2">
                    {liveHotels.length > 0 ? (
                        liveHotels.map((h, i) => (
                            <div key={i} className="group min-w-[300px] md:min-w-[340px] relative rounded-[2rem] overflow-hidden bg-[#0a0a0a] border border-white/5 transition-all duration-700 hover:border-skyBlue/30 shadow-2xl">

                                {/* Height reduced from 450px to 380px for a sleeker look */}
                                <div className="relative h-[380px] w-full overflow-hidden">
                                    <Image
                                        src={`/images/hotels/${h.city.toLowerCase()}-${i + 1}.jpg`}
                                        alt={h.name}
                                        width={400}
                                        height={300}
                                        unoptimized={true}
                                        className="object-cover w-full h-full"
                                    />

                                    {/* Star Rating Overlay: Smaller & Cleaner */}
                                    <div className="absolute top-6 left-6 flex gap-0.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="text-skyBlue text-[7px]">✦</span>
                                        ))}
                                    </div>

                                    {/* Location Badge: Smaller */}
                                    <div className="absolute top-6 right-6 text-[8px] font-black text-black gth-glass px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl group-hover:bg-skyBlue group-hover:text-white transition-colors duration-500">
                                        {h.city || city || "Elite"}
                                    </div>

                                    {/* Overlay Gradient: Tighter */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-100" />
                                </div>

                                {/* Content Section: Tighter Padding & Better Spacing */}
                                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <p className="text-skyBlue text-[8px] font-black tracking-[0.4em] uppercase mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700">Available Now</p>
                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic leading-tight mb-4 group-hover:tracking-tight transition-all duration-500">
                                        {h.name || h.hotelName}
                                    </h3>

                                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Elite Rate</p>
                                            <p className="text-xl font-black text-white tracking-tighter">
                                                {h.price || h.priceAvg || "—"} <span className="text-[9px] text-white/30 font-light">INR</span>
                                            </p>
                                        </div>

                                        <a
                                            href={h.affiliate_link || `https://search.hotellook.com/hotels?hotelId=${h.hotelId}&marker=YOUR_MARKER`}
                                            target="_blank"
                                            className="gth-glass text-black text-[9px] font-black px-5 py-3 rounded-xl hover:bg-skyBlue hover:text-white transition-all duration-500 uppercase tracking-widest shadow-2xl"
                                        >
                                            Inquire
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-white/20 text-lg font-light italic py-10">No private residences found in this sector.</div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}