import { generateHotels } from "@/lib/autoHotels"

export default function HotelSection({ destination }: any) {

    const hotels = generateHotels(destination.slug).slice(0, 4)

    return (

        <section className="max-w-7xl mx-auto px-6 py-20">

            <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                Featured Hotels
            </h2>

            <div className="grid md:grid-cols-4 gap-6">

                {hotels.map((hotel: any) => (

                    <div
                        key={hotel.id}
                        className="relative group rounded-xl overflow-hidden"
                    >

                        <img
                            src={hotel.images[0]}
                            className="h-40 w-full object-cover group-hover:scale-110 transition"
                        />

                        <div className="absolute inset-0 bg-black/50" />

                        <div className="absolute bottom-4 left-4">

                            <h3 className="text-white text-sm">
                                {hotel.name}
                            </h3>

                            <a
                                href={`/hotels/${hotel.slug}`}
                                className="text-yellow-400 text-xs"
                            >
                                View →
                            </a>

                        </div>

                    </div>

                ))}

            </div>

        </section>
    )
}