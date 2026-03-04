import { hotels } from "@/data/hotels"
import Link from "next/link"

export default function HotelsPage() {
    return (
        <div className="bg-black text-white min-h-screen p-10">
            <h1 className="text-3xl font-bold mb-10 text-yellow-400">
                All Hotels
            </h1>

            <div className="grid md:grid-cols-3 gap-8">
                {hotels.map((hotel) => (
                    <div key={hotel.id} className="bg-[#1a1a1a] p-6 rounded-xl">
                        <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="h-60 w-full object-cover rounded-lg mb-4"
                        />

                        <h2 className="text-xl font-semibold mb-2">
                            {hotel.name}
                        </h2>

                        <p className="text-gray-400 mb-4">
                            {hotel.location}
                        </p>

                        <Link
                            href={`/hotels/${hotel.id}`}
                            className="bg-yellow-500 text-black px-4 py-2 rounded-lg inline-block"
                        >
                            View Hotel
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}