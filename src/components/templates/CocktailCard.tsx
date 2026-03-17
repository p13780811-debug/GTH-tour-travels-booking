// @ts-nocheck
import React from 'react';

export default function CocktailCard({ hotel }) {
    return (
        <div className="bg-white border-b md:border md:rounded-2xl overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-lg">

            {/* 1. AIRBNB STYLE IMAGE (Mobile par square, Desktop par side mein) */}
            <div className="relative w-full md:w-72 h-56 md:h-auto overflow-hidden">
                <img
                    src={hotel.image_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={hotel.name}
                />
                {/* Agoda Style Tag */}
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                    FLASHSALE 25% OFF
                </div>
            </div>

            {/* 2. CONTENT SECTION (Mix of Booking & TripAdvisor) */}
            <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">
                            {hotel.name}
                        </h3>
                        {/* Booking.com Style Rating */}
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold leading-none">Excellent</p>
                                <p className="text-[10px] text-gray-500">1,205 reviews</p>
                            </div>
                            <div className="bg-[#003580] text-white p-1.5 rounded-lg font-bold text-sm">
                                8.9
                            </div>
                        </div>
                    </div>

                    {/* TripAdvisor Style Location + Bubbles */}
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        📍 {hotel.location}
                    </p>

                    <div className="flex items-center gap-1 mt-2">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>)}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">#1 Best Value</span>
                    </div>
                </div>

                {/* 3. PRICE & CTA (The 'Money' Section) */}
                <div className="flex justify-between items-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-gray-100">
                    <div className="space-y-1">
                        <p className="text-[10px] text-green-700 font-bold uppercase">Free Cancellation</p>
                        <p className="text-[10px] text-gray-400">Total Price: ₹{hotel.price + 500} (with taxes)</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-gray-900 leading-none">₹{hotel.price}</p>
                        <button className="bg-[#006ce4] text-white px-4 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-blue-700 transition-all">
                            See Deal &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}