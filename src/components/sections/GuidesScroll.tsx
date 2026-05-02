"use client"

export default function GuidesScroll({ city }: { city?: string }) {

    const guides = [
        "Goa Travel Guide",
        "Dubai Travel Guide",
        "Paris Travel Guide",
    ]

    return (

        <section className="py-16">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-8">
                    Travel Guides {city ? `in ${city}` : ""}
                </h2>

                <div className="flex gap-6 overflow-x-auto">

                    {guides.map((g, i) => (

                        <div key={i} className="min-w-[240px] p-10 gth-glass-100 rounded-xl">

                            {g}

                        </div>

                    ))}

                </div>

            </div>

        </section>

    )
}