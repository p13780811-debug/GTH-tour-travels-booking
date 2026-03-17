export default function GlassMenu({ city }: { city?: string }) {

    const menu = [
        "Flights",
        "Hotels",
        "Tours",
        "Transfers",
        "Insurance"
    ]

    return (

        <section className="py-8 bg-black">

            <div className="max-w-7xl mx-auto px-6">

                <div className="flex gap-4 overflow-x-auto">

                    {menu.map((item, i) => (

                        <button
                            key={i}
                            className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-lg text-white border border-white/20 hover:bg-sky-500 transition"
                        >
                            {item} {city ? `in ${city}` : ""}
                        </button>

                    ))}

                </div>

            </div>

        </section>

    )
}