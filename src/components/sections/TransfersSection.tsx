export default function TransfersSection({ city }: { city?: string }) {

    const items = [
        "Airport Transfer",
        "Car Rental",
        "Private Driver"
    ]

    return (


        <section className="py-20 bg-black text-white">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-10">
                    Transfers & Rentals {city ? `in ${city}` : ""}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">

                    {items.map((t, i) => (

                        <div key={i} className="p-12 bg-white/10 rounded-xl text-center">

                            {t}

                        </div>

                    ))}

                </div>

            </div>

        </section>

    )
}