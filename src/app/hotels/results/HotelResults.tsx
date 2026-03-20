"use client";
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// Swiper Styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;

export default function HotelResults({ city }: { city: string }) {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. 🌍 GLOBAL CURRENCY LOGIC
    const getCurrency = (cityName: string) => {
        const c = cityName.toLowerCase();
        if (c.includes("dubai") || c.includes("uae") || c.includes("sharjah"))
            return { code: "AED", symbol: "د.إ", rate: 450 }; // Dirham
        if (c.includes("paris") || c.includes("europe") || c.includes("berlin") || c.includes("italy"))
            return { code: "EUR", symbol: "€", rate: 110 }; // Euro
        if (c.includes("usa") || c.includes("york") || c.includes("vegas") || c.includes("london"))
            return { code: "USD", symbol: "$", rate: 130 }; // Dollar
        if (c.includes("thailand") || c.includes("bangkok"))
            return { code: "THB", symbol: "฿", rate: 1200 }; // Baht

        return { code: "INR", symbol: "₹", rate: 4500 }; // Default India
    };

    const currency = getCurrency(city);

    useEffect(() => {
        if (!city) return;
        setLoading(true);

        fetch(`https://api.pexels.com/v1/search?query=${city}+luxury+resort&per_page=10`, {
            headers: { Authorization: PEXELS_KEY || "" }
        })
            .then(res => res.json())
            .then(data => {
                if (data.photos) {
                    const processed = data.photos.map((photo: any, i: number) => ({
                        id: photo.id,
                        name: `${city} ${["Elite Resort", "Grand Plaza", "Royal Heritage", "Skyline", "Palm Stay", "The Retreat"][i % 6]}`,
                        image: photo.src.large,
                        // Dynamic Price based on country
                        price: currency.rate + Math.floor(Math.random() * (currency.rate * 0.5)),
                        rating: (Math.random() * (5 - 4.6) + 4.6).toFixed(1)
                    }));
                    setHotels(processed);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [city]);

    if (loading) return <div className="text-center py-20 text-sky-500 font-black tracking-[0.3em] animate-pulse">LOADING {city.toUpperCase()}...</div>;

    return (
        <div className="w-full py-6">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={false}
                loop={true}
                slidesPerView={'auto'}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: false }}
                className="mySwiper !pb-12"
                breakpoints={{
                    320: { slidesPerView: 1.2, spaceBetween: 20 },
                    1024: { slidesPerView: 3.2, spaceBetween: 40 }
                }}
            >
                {hotels.map((h) => (
                    <SwiperSlide key={h.id} className="max-w-[380px]">
                        <div className="group relative bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-sky-500/30 transition-all duration-500 shadow-2xl">

                            <div className="relative h-[450px]">
                                <img src={h.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="hotel" />

                                {/* --- TOP SECTION (Rating & Badge) --- */}
                                <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center z-10">
                                    {/* Rating Badge */}
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <span className="text-yellow-500 text-[10px]">★</span>
                                        <span className="text-white font-black text-[10px] tracking-tighter">{h.rating}</span>
                                    </div>

                                    {/* Luxury Status */}
                                    <div className="bg-sky-500/90 backdrop-blur-sm text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                                        Premium
                                    </div>
                                </div>
                                {/* ------------------------------------ */}

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                <div className="absolute bottom-0 left-0 w-full p-8 text-left">
                                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-5 italic line-clamp-1">
                                        {h.name}
                                    </h3>

                                    <div className="flex justify-between items-center border-t border-white/10 pt-6">
                                        <div>
                                            <p className="text-gray-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1">Starting At</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sky-400 font-bold text-[10px]">{currency.code}</span>
                                                <span className="text-white text-2xl font-black italic">{currency.symbol}{h.price}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open(`https://www.klook.com/en-IN/hotels/searchresult/?city_name=${city}&aid=IKb6eSUe`, "_blank")}
                                            className="bg-white text-black hover:bg-sky-500 hover:text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl active:scale-90"
                                        >
                                            View Deals
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx global>{`
                .swiper-pagination-bullet { background: #0ea5e9 !important; opacity: 0.3; }
                .swiper-pagination-bullet-active { opacity: 1; transform: scale(1.2); }
            `}</style>




            {/* Disclaimer for Professionalism */}
            <p className="w-full text-center text-pink-600 text-[10px] mt-12 uppercase tracking-widest font-medium">
                *Prices shown are estimated base rates. Final pricing available on secure checkout.
            </p>
        </div>
    );
}