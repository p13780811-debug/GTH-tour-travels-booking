"use client";

import React from 'react';

export default function HotelSection({ destination }: any) {
    return (
        <section className="max-w-7xl mx-auto py-12 px-4 overflow-hidden">
            {/* Compact Header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                    Hotels in <span className="text-yellow-500">{destination.name}</span>
                </h2>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/10 pb-1">
                    See All
                </span>
            </div>

            {/* Horizontal Scroll Container - Height Reduced */}
            <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory">

                {destination.hotels?.map((hotel: any, i: number) => {
                    // Pexels unique photo logic
                    const city = destination.slug.split("-")[0];

                    const localImage = `/images/hotels/${city}-${i + 1}.jpg`;

                    return (
                        <div
                            key={i}
                            className="min-w-[240px] md:min-w-[280px] snap-start group"
                        >
                            <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden border border-white/5 hover:border-yellow-400/30 transition-all duration-300 shadow-xl">

                                {/* Image - Height significantly reduced */}
                                <div className="relative h-44 overflow-hidden">
                                    <img
                                        src={hotel.image_url || localImage}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] text-yellow-400 font-bold">
                                        ★ 4.8
                                    </div>
                                </div>

                                {/* Compact Content Section */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-2 mb-4">
                                        <h3 className="text-sm font-bold text-white leading-tight truncate flex-1">
                                            {hotel.name}
                                        </h3>
                                        <p className="text-yellow-500 font-black text-sm whitespace-nowrap">
                                            {hotel.price}
                                        </p>
                                    </div>

                                    {hotel.affiliate_link && (
                                        <a
                                            href={hotel.affiliate_link}
                                            target="_blank"
                                            className="block text-center bg-white/5 hover:bg-yellow-400 text-white hover:text-black py-2 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"
                                        >
                                            View Deal
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Chota Explore Button */}
                <div className="min-w-[120px] snap-start flex items-center justify-center">
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-yellow-400 transition-all">
                            <span className="text-white group-hover:text-black text-sm">→</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">More</span>
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}