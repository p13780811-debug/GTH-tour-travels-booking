export default function BlogSection({ city }: any) {

    return (

        <section className="max-w-7xl mx-auto px-6 py-16">

            <h2 className="text-3xl font-bold text-yellow-400 mb-8">
                Travel Blogs about {city}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">

                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#1a1a1a] p-6 rounded-xl">
                        Blog Post {i}
                    </div>
                ))}

            </div>

        </section>

    )
}