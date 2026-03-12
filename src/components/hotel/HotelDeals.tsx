import { fetchGTHData } from "@/lib/aggregator"

export default async function HotelDeals({ city }: any) {

    let hotels: any[] = []

    try {
        hotels = await fetchGTHData(city)
    } catch (e) {
        hotels = []
    }

    if (!hotels.length) {
        return (
            <section className="p-10 text-center text-gray-400">
                Searching live deals...
            </section>
        )
    }

    return (

        <section className="max-w-6xl mx-auto py-16 px-6">

            <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                Hotel Deals
            </h2>

            <div className="grid gap-6">

                {hotels.map((hotel: any) => (

                    <div key={hotel.slug} className="bg-[#1a1a1a] p-6 rounded-xl">

                        <h3 className="text-xl font-bold">{hotel.name}</h3>

                        <p className="text-gray-400 text-sm">
                            {hotel.description}
                        </p>

                        <div className="flex justify-between mt-4">

                            <span className="text-2xl font-bold">
                                {hotel.price} {hotel.currency}
                            </span>

                            <a
                                href={hotel.partner_link}
                                target="_blank"
                                className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold"
                            >
                                View Deal
                            </a>

                        </div>

                    </div>

                ))}

            </div>

        </section>
    )
}