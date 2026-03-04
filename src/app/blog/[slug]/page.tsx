import { blogs } from "@/data/blogs";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
    return blogs.map((blog) => ({
        slug: blog.slug,
    }));
}

export default async function BlogPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    // Next.js 15 mein params ko await karna zaroori hai
    const { slug } = await params;

    const blog = blogs.find((b) => b.slug === slug);

    if (!blog) return notFound();

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto py-20 px-4">
                <h1 className="text-4xl font-bold text-blue-500 mb-8">
                    {blog.title}
                </h1>
                <div className="prose prose-invert">
                    {/* Aapka baaki content yahan aayega */}
                    <p>{blog.description || "Blog content coming soon..."}</p>
                </div>
            </div>
        </div>
    );
}