import { blogs } from "@/data/blogs"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
    return blogs.map((blog) => ({
        slug: blog.slug,
    }))
}

export default function BlogPage({
    params,
}: {
    params: { slug: string }
}) {
    const blog = blogs.find((b) => b.slug === params.slug)

    if (!blog) return notFound()

    return (
        <div className="min-h-screen bg-black text-white px-6 py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                    {blog.title}
                </h1>

                <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-96 object-cover rounded-xl mb-8"
                />

                <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {blog.content}
                </div>
            </div>
        </div>
    )
}