import { destinations } from "@/data/destinations"
import Link from "next/link"

export default function RelatedSection({ currentSlug }: any) {

    const related = destinations
        .filter((d: any) => d.slug !== currentSlug)
        .slice(0, 3)

    return (

        <section className="max-w-7xl mx-auto px-6 py-20">

            <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                Explore More Destinations
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

                {related.map((d: any) => (

                    <Link
                        key={d.slug}
                        href={`/destinations/${d.slug}`}
                        className="block bg-[#1a1a1a] rounded-xl overflow-hidden"
                    >

                        <img
                            src={d.heroImage}
                            className="h-48 w-full object-cover"
                        />

                        <div className="p-4">

                            <h3 className="text-yellow-400">
                                {d.name}
                            </h3>

                        </div>

                    </Link>

                ))}

            </div>

        </section>
    )
}