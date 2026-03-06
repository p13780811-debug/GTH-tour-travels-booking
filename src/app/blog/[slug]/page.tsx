import { blogs } from "@/data/blogs"
import { notFound } from "next/navigation"
import Link from "next/link"

export default function BlogPage({ params }: { params: { slug: string } }) {

    const blog = blogs.find((b) => b.slug === params.slug)

    if (!blog) {
        notFound()
    }

    return (
        <div className="bg-black text-white min-h-screen">

            {/* HERO */}
            <div className="relative h-[60vh]">

                <img
                    src={blog.image}
                    alt={blog.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/60"></div>

                <div className="relative z-10 flex flex-col justify-center h-full px-6 max-w-4xl mx-auto">

                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-6">
                        {blog.title}
                    </h1>

                    <p className="text-gray-300 text-lg">
                        {blog.description}
                    </p>

                </div>
            </div>

            {/* CONTENT */}

            <div className="max-w-4xl mx-auto px-6 py-16">

                <p className="text-gray-300 leading-relaxed mb-6">
                    This travel guide covers the best hotels, attractions, food spots and
                    travel tips for {blog.title}.
                </p>

                <Link
                    href="/destinations"
                    className="inline-block mt-6 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold"
                >
                    Explore Destinations →
                </Link>

            </div>

        </div>
    )
}