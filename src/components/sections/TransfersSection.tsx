export default function TransfersSection({ city }: { city?: string }) {

    const items = [
        { label: "Airport Transfer", href: "/transfers" },
        { label: "Car Rental", href: "/cars" },
        { label: "Private Driver", href: "/transfers" }
    ]

    return (


        <section className="py-20 bg-black text-white">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-10">
                    Transfers & Rentals {city ? `in ${city}` : ""}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">

                    {items.map((t, i) => (

                        <a key={i} href={t.href} className="block p-12 gth-glass/10 rounded-xl text-center">

                            {t.label}

                        </a>

                    ))}

                </div>

            </div>

        </section>

    )
}