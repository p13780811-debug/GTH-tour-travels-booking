import Link from "next/link"
import { blogs } from "@/data/blogs"

export default function BlogList() {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-16">
            <h1 className="text-4xl font-bold text-yellow-400 mb-12 text-center">
                Travel Guides & Luxury Insights
            </h1>

            <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                {blogs.map((blog) => (
                    <Link
                        key={blog.slug}
                        href={`/blog/${blog.slug}`}
                        className="bg-[#1a1a1a] rounded-xl overflow-hidden hover:scale-105 transition"
                    >
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="h-64 w-full object-cover"
                        />

                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-2">
                                {blog.title}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {blog.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}