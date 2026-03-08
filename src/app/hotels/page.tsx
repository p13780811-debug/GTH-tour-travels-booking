import { generateHotels } from "@/lib/autoHotels"
import Link from "next/link"
import HotelSearch from "@/components/HotelSearch"


export default function HotelsPage() {
    // 1. Sabhi cities ke naam
    const mainCities = ["goa", "paris", "dubai", "jaipur"];

    // 2. Har city se 20-20 hotels mangwao
    const allHotels = mainCities.flatMap(city => generateHotels(city).slice(0, 20));

    return (


        <div className="bg-black min-h-screen text-white p-10">
            <h1 className="text-3xl font-bold text-yellow-400 mb-10">
                Premium Global Hotels
            </h1>
            <main className="min-h-screen pt-24 px-6">

                <HotelSearch />

            </main>
            <div className="grid md:grid-cols-3 gap-8">
                {allHotels.map((hotel) => (
                    <Link
                        key={hotel.slug}
                        href={`/hotels/${hotel.slug}`}
                        className="bg-[#1a1a1a] rounded-xl overflow-hidden hover:scale-105 transition group"
                    >
                        <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="h-60 w-full object-cover"
                        />
                        <div className="p-5">
                            <h2 className="text-xl font-semibold group-hover:text-yellow-400">
                                {hotel.name}
                            </h2>
                            <p className="text-gray-400 text-sm">Luxury Stay</p>
                            <div className="text-yellow-400 mt-2 font-bold">
                                Starting from ₹{hotel.id.includes('goa') ? '8,500' : '25,000'}
                            </div>
                        </div>
                    </Link>


                ))}

            </div>

        </div>
    )
}






