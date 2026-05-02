export default function ActivitiesGrid({ city }: { city?: string }) {

    const activities = [
        "City Tours",
        "Food Tours",
        "Adventure",
        "Museum Tickets",
    ]

    return (

        <section className="py-20">

            <div className="max-w-7xl mx-auto px-6">

                <h2 className="text-3xl font-bold mb-10">
                    Experiences in {city ? `in ${city}` : ""}
                </h2>

                <div className="grid md:grid-cols-4 gap-6">

                    {activities.map((a, i) => (

                        <div key={i} className="p-10 gth-glass-100 rounded-xl text-center font-semibold">

                            {a}

                        </div>

                    ))}

                </div>

            </div>

        </section>

    )
}