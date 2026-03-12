export default function Activities({ city }: any) {

    const activities = [
        "City Tour",
        "Boat Cruise",
        "Food Tour",
        "Museum Visit"
    ]

    return (

        <section className="max-w-7xl mx-auto px-6 py-16">

            <h2 className="text-3xl font-bold text-yellow-400 mb-8">
                Activities in {city}
            </h2>

            <div className="grid md:grid-cols-4 gap-6">

                {activities.map((a, i) => (
                    <div key={i} className="bg-[#1a1a1a] p-6 rounded-xl">
                        {a}
                    </div>
                ))}

            </div>

        </section>
    )
}