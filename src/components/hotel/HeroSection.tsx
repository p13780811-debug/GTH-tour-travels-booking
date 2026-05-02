// @ts-nocheck
import React from 'react'

export default function HeroSection({ slug, city }) {
    return (
        <div className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
            {/* Background Image with Premium Overlay */}
            <div className="absolute inset-0">
                <img
                    src="https://images.pexels.com/photos/189333/pexels-photo-189333.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1" // Yahan asli city image ka logic dalna
                    className="w-full h-full object-cover"
                    alt={city}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
            </div>

            {/* CONTENT: Mobile Friendly & Responsive */}
            <div className="relative h-full flex flex-col justify-center items-center px-4 text-center">
                {/* Typewriting Headline: Now Responsive! */}
                <h1 className="text-3xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none">
                    Explore <span className="text-yellow-400">{city}</span>
                </h1>

                <p className="mt-4 text-sm md:text-xl text-gray-200 font-medium max-w-2xl">
                    AI-Curated deals from 5 Million+ properties.
                    <span className="hidden md:inline"> Handpicked for the ultimate GTH PRO experience.</span>
                </p>

                {/* Global Search Bar (Booking.com Style) */}
                <div className="mt-8 w-full max-w-4xl gth-glass p-1 md:p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2">
                    <div className="flex-1 px-4 py-2 text-black flex items-center gap-2 border-b md:border-b-0 md:border-r">
                        <span className="text-blue-600">📍</span>
                        <input type="text" placeholder="Search hotels, activities..." className="w-full outline-none font-bold" />
                    </div>
                    <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-black hover:bg-black transition-all">
                        SEARCH
                    </button>
                </div>
            </div>
        </div>
    )
}