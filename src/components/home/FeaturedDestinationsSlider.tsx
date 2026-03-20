"use client"

import Image from "next/image"
import Link from "next/link"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"

import "swiper/css"
import "swiper/css/navigation"

export default function FeaturedDestinationsSlider({
    cities,
}: {
    cities: any[]
}) {

    return (
        <section className="py-10 bg-gray-50 px-8">

            <h2 className="text-3xl font-bold text-black text-center mb-10">
                Featured Destinations
            </h2>

            <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={2}
                navigation
                breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 5 },
                }}
            >

                {cities.map((city) => (

                    <SwiperSlide key={city.slug}>

                        <div className="relative rounded-xl overflow-hidden shadow-lg hover:scale-105 transition">

                            <Image
                                src={city.image_url || "/images/default-city.jpg"}
                                alt={city.name}
                                width={400}
                                height={250}
                                className="object-cover w-full h-48"
                            />

                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center">

                                <h3 className="font-semibold text-lg">{city.name}</h3>

                                <Link href={`/destinations/${city.slug}`}>
                                    <button className="mt-2 bg-skyBlue px-4 py-2 rounded-lg text-white hover:bg-skyPink transition">
                                        Explore
                                    </button>
                                </Link>

                            </div>

                        </div>

                    </SwiperSlide>

                ))}

            </Swiper>

        </section>
    )
}