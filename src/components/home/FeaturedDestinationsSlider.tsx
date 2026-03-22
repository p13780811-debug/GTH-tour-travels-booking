"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay, EffectCoverflow } from "swiper/modules"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/effect-coverflow"

export default function FeaturedDestinationsSlider({
    cities,
}: {
    cities: any[]
}) {
    return (
        <section className="py-20 bg-black overflow-hidden perspective-1000">
            {/* Professional Luxury Heading */}
            <div className="text-center mb-16">
                <h2 className="text-[#f59e0b] text-4xl font-black tracking-[12px] uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    Featured Destinations
                </h2>
                <div className="h-1 w-24 bg-[#f59e0b] mx-auto mt-4 shadow-[0_0_15px_#f59e0b]"></div>
            </div>

            <Swiper
                modules={[Navigation, Autoplay, EffectCoverflow]}
                effect={"coverflow"}
                grabCursor={true}
                centeredSlides={true}
                loop={true}
                spaceBetween={30}
                slidesPerView={"auto"}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                coverflowEffect={{
                    rotate: 30, // 3D Rotation
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: false,
                }}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 }, // Standard Luxury Spacing
                }}
                navigation={true}
                className="mySwiper px-10"
            >
                {cities.map((city) => (
                    <SwiperSlide key={city.slug} className="!w-[350px]"> {/* Size maintained */}
                        <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 hover:border-[#f59e0b]/50">

                            {/* Image Section - Exactly as you requested */}
                            <Image
                                src={city.image_url || "/images/default-city.jpg"}
                                alt={city.name}
                                width={400}
                                height={250}
                                className="object-cover w-full h-[350px] transition-transform duration-1000 group-hover:scale-110"
                            />

                            {/* Luxury Overlay - Black to Transparent */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

                            <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className="text-white font-black text-3xl uppercase italic tracking-tighter mb-4">
                                    {city.name}
                                </h3>

                                <Link href={`/destinations/${city.slug}`}>
                                    <button className="w-full py-3 bg-transparent border border-[#f59e0b] text-[#f59e0b] font-bold uppercase tracking-widest rounded-xl hover:bg-[#f59e0b] hover:text-black transition-all duration-300">
                                        Explore Destination
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons Styling */}
            <style jsx global>{`
                .swiper-button-next, .swiper-button-prev {
                    color: #f59e0b !important;
                    background: rgba(0,0,0,0.5);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 1px solid #f59e0b;
                }
                .swiper-button-next:after, .swiper-button-prev:after {
                    font-size: 20px !important;
                    font-weight: bold;
                }
            `}</style>
        </section>
    )
}