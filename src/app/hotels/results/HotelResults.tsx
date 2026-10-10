"use client";
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// Swiper Styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';



export default function HotelResults({ city }: { city: string }) {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!city) return;
        const controller = new AbortController();
        setLoading(true);
        setHotels([]);
        fetch(`/api/hotels?city=${encodeURIComponent(city)}`, { signal: controller.signal })
            .then(res => { if (!res.ok) throw new Error("Hotel data unavailable"); return res.json(); })
            .then(data => setHotels(Array.isArray(data) ? data : []))
            .catch(() => setHotels([]))
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [city]);

    if (loading) return <div className="text-center py-20 text-sky-500 font-black tracking-[0.3em] animate-pulse">LOADING {city.toUpperCase()}...</div>;

    if (!hotels.length) return <p className="text-center py-12">No hotel listings available for this city.</p>;

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
                                        <span className="text-white font-black text-[10px] tracking-tighter">{h.stars ? `${h.stars} stars` : "Hotel"}</span>
                                    </div>

                                    {/* Luxury Status */}
                                    <div className="bg-sky-500/90 backdrop-blur-sm text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                                        Hotel
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
                                            <p className="text-gray-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1">Price</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sky-400 font-bold text-[10px]"></span>
                                                <span className="text-white text-2xl font-black italic">See partner for current price</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open(`https://www.klook.com/en-IN/hotels/searchresult/?city_name=${encodeURIComponent(city)}&aid=IKb6eSUe`, "_blank", "noopener,noreferrer")}
                                            className="gth-glass text-black hover:bg-sky-500 hover:text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl active:scale-90"
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
                Current prices and availability must be confirmed with the booking partner.
            </p>
        </div>
    );
}