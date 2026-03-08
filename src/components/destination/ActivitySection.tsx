export default function ActivitySection({ destination }: any) {

    const activities = [
        { title: "Adventure Experience", price: "2,999" },
        { title: "Guided City Tour", price: "1,499" },
        { title: "Sunset Cruise", price: "3,499" },
    ]

    return (

        <section className="max-w-6xl mx-auto px-6 py-20">

            <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                Top Activities
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

                {activities.map((a, i) => (

                    <div
                        key={i}
                        className="bg-[#1a1a1a] p-6 rounded-xl"
                    >

                        <h3 className="text-xl text-yellow-400 mb-2">
                            {a.title}
                        </h3>

                        <p className="text-gray-400 mb-4">
                            ₹{a.price}
                        </p>

                        <a
                            href={`/go/${destination.slug}`}
                            className="bg-yellow-500 text-black px-4 py-2 rounded"
                        >
                            Book
                        </a>

                    </div>

                ))}

            </div>

        </section>
    )
}