import Image from "next/image"
import Link from "next/link"

const destinations = [
    { name: "Paris", image: "/images/cities/paris.jpg", slug: "paris" },
    { name: "Dubai", image: "/images/cities/dubai.jpg", slug: "dubai" },
    { name: "Goa", image: "/images/cities/goa.jpg", slug: "goa" },
    { name: "Bali", image: "/images/cities/bali.jpg", slug: "bali" },
    { name: "Tokyo", image: "/images/cities/tokyo.jpg", slug: "tokyo" },
]

export default function DestinationScroll({ city }: { city?: string }) {

    return (

        <section className="py-16 gth-glass">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-8">
                    Featured Destinations {city ? `in ${city}` : ""}
                </h2>

                <div className="flex gap-6 overflow-x-auto pb-4">

                    {destinations.map((destination, i) => (

                        <Link
                            key={i}
                            href={`/destinations/${destination.slug}`}
                            className="min-w-[220px] relative rounded-xl overflow-hidden shadow-lg group"
                        >

                            <Image
                                src={destination.image}
                                alt={destination.name}
                                width={300}
                                height={200}
                                className="object-cover w-full h-40 group-hover:scale-110 transition"
                            />

                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 text-center">

                                <h3 className="font-semibold">
                                    {destination.name}
                                </h3>

                            </div>

                        </Link>

                    ))}

                </div>

            </div>

        </section>

    )

}