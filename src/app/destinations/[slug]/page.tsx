import { destinations } from "@/data/destinations"
import { notFound } from "next/navigation"
import BookingSection from "./BookingSection"

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function DestinationPage({ params }: PageProps) {

    const { slug } = await params

    const destination = destinations.find(
        (d) => d.slug === slug
    )

    if (!destination) {
        notFound()
    }

    return (
        <div className="bg-[#0e0e0e] text-white min-h-screen">

            {/* HERO */}
            <div className="relative h-[70vh] w-full">
                <img
                    src={destination.heroImage}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center px-6">
                        <h1 className="text-5xl font-bold text-yellow-400 mb-4">
                            {destination.name}
                        </h1>

                        <p className="max-w-2xl mx-auto text-gray-300">
                            {destination.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* BOOKING */}
            <BookingSection />

            {/* FEATURED HOTEL */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                    Featured Stay
                </h2>

                <div className="bg-[#1a1a1a] border border-yellow-500/20 p-8 rounded-3xl">
                    <h3 className="text-2xl font-semibold mb-2">
                        {destination.featuredHotel.name}
                    </h3>

                    <p className="text-gray-400 mb-3">
                        {destination.featuredHotel.location}
                    </p>

                    <p className="text-yellow-400 text-lg font-semibold mb-6">
                        {destination.featuredHotel.price}
                    </p>

                    <a
                        href={`https://wa.me/${destination.featuredHotel.whatsapp}`}
                        target="_blank"
                        className="inline-block px-6 py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition"
                    >
                        Book on WhatsApp
                    </a>
                </div>
            </section>

            {/* OTHER HOTELS */}
            <section className="max-w-6xl mx-auto px-6 pb-20">
                <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                    Other Hotels
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {destination.hotels.map((hotel, index) => (
                        <div
                            key={index}
                            className="bg-[#1a1a1a] border border-yellow-500/10 p-6 rounded-2xl"
                        >
                            <h3 className="text-lg font-semibold mb-2">
                                {hotel.name}
                            </h3>
                            <p className="text-yellow-400 font-medium">
                                {hotel.price}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* GUIDES */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                    Local Guides
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {destination.guides.map((guide, index) => (
                        <div
                            key={index}
                            className="bg-[#151515] p-6 rounded-2xl border border-yellow-500/10"
                        >
                            <h3 className="text-lg font-semibold mb-2">
                                {guide.name}
                            </h3>
                            <p className="text-gray-400">
                                {guide.experience}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
}