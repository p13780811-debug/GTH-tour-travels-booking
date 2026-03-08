import Link from "next/link"

export default function BlogSection({ blogs }: any) {

    return (

        <section className="max-w-7xl mx-auto px-6 py-20">

            <h2 className="text-3xl font-bold text-yellow-400 mb-10">
                Travel Guides
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

                {blogs.slice(0, 3).map((blog: any) => (

                    <Link
                        key={blog.slug}
                        href={`/blog/${blog.slug}`}
                        className="block bg-[#1a1a1a] rounded-xl overflow-hidden"
                    >

                        <img
                            src={blog.image}
                            className="h-48 w-full object-cover"
                        />

                        <div className="p-4">

                            <h3 className="text-yellow-400">
                                {blog.title}
                            </h3>

                        </div>

                    </Link>

                ))}

            </div>

        </section>
    )
}