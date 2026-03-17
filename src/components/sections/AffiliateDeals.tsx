export default function AffiliateDeals({ city }: { city?: string }) {

    const partners = [
        "Trip Deals",
        "Activities Deals",
        "Insurance Deals"
    ]

    return (

        <section className="py-20 bg-gray-900 text-white">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-10">
                    Exclusive Deals {city ? `in ${city}` : ""}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">

                    {partners.map((p, i) => (

                        <a
                            key={i}
                            href="/go/klook"
                            className="p-12 bg-white/10 rounded-xl text-center hover:bg-sky-500 transition block"
                        >
                            {p}
                        </a>

                    ))}

                </div>

            </div>

        </section>

    )
}