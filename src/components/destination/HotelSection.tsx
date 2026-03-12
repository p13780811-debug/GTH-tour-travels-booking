import { generateHotels } from "@/lib/autoHotels"

export default function HotelSection({ destination }: any) {

    return (

        <section className="max-w-7xl mx-auto py-20 px-6">

            <h2 className="text-3xl font-bold mb-10">
                Best Hotels in {destination.name}
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

                {destination.hotels?.map((hotel: any, i: number) => (

                    <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden">

                        <img
                            src={hotel.image_url}
                            alt={hotel.name}
                            className="w-full h-56 object-cover"
                        />

                        <div className="p-6">

                            <h3 className="text-xl font-semibold mb-2">
                                {hotel.name}
                            </h3>

                            <p className="text-gray-400 mb-4">
                                {hotel.price}
                            </p>

                            {hotel.affiliate_link && (

                                <a
                                    href={hotel.affiliate_link}
                                    target="_blank"
                                    className="inline-block bg-yellow-500 text-black px-5 py-2 rounded-lg"
                                >
                                    View Deal
                                </a>

                            )}

                        </div>

                    </div>

                ))}

            </div>

        </section>
    )
}