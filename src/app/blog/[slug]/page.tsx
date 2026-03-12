// src/app/blog/[slug]/page.tsx

import { blogs } from "@/data/blogs";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image"; // Next.js Optimized Image zaroori hai
import { Metadata } from "next";

export async function generateStaticParams() {
    return blogs.map((blog) => ({
        slug: blog.slug
    }))
}


// 1. DYNAMIC SEO - Google Search ke liye Title aur Photo fix
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const blog = blogs.find((b) => b.slug === slug);
    if (!blog) return { title: "Not Found" };

    return {
        title: `${blog.title} | GTH Pro Elite Guide`,
        description: blog.description,
        openGraph: {
            title: blog.title,
            description: blog.description,
            images: [{ url: blog.image }], // WhatsApp share ke liye dynamic image link
        },
    };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const blog = blogs.find((b) => b.slug === slug);

    if (!blog) notFound();

    // 2. SCHEMA - Google Robots ko dynamic data batana
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "image": blog.image,
        "description": blog.description,
        "author": { "@type": "Organization", "name": "GTH Pro" }
    };

    return (
        <main className="bg-[#050505] text-white min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            {/* --- HERO SECTION: Dynamic Image Implemented --- */}
            <div className="relative h-[75vh] flex items-center overflow-hidden pt-24 border-b border-[#1a1a1a]">
                {/* NO RED LINE FIX: Use optional chaining (?.) and fallback image
                  'blog.image' is now dynamic and distinct for each post
                */}
                <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                    priority
                    quality={90} // HD quality settings for Premium feel
                />

                {/* Luxury Gradient Overlay - Corrected to focus on text area */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent z-0"></div>

                <div className="relative z-10 w-full px-6 max-w-6xl mx-auto text-center md:text-left mt-10">
                    <span className="text-[#d4af37] font-bold tracking-[0.4em] text-[10px] md:text-xs uppercase mb-4 block animate-pulse">
                        GTH Premium Travel Guide
                    </span>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black gold-text mb-6 leading-tight md:leading-none">
                        {blog.title}
                    </h1>
                    <p className="text-gray-300 text-lg md:text-2xl max-w-2xl font-light leading-relaxed px-4 md:px-0 mx-auto md:mx-0">
                        {blog.description}
                    </p>
                </div>
            </div>

            {/* --- CONTENT AREA: Optimized for Luxury Look --- */}
            <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">

                {/* Main Article Body */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 md:p-10 rounded-2xl border border-[#d4af37]/10 luxury-card hover:border-[#d4af37]/30 transition-all duration-500">

                        {/* 3. DYNAMIC BODY - Asli AI Content with Fallback */}
                        <div
                            className="prose prose-invert prose-gold max-w-none text-gray-300 leading-relaxed text-base md:text-lg space-y-6 font-light"
                            dangerouslySetInnerHTML={{ __html: (blog as any).content || `<p className="italic text-gray-500">Luxury guide for ${blog.title} is being curated by our AI engine...</p>` || "" }}
                        />

                        {/* CTA Button */}
                        <div className="mt-12 text-center md:text-left">
                            <Link
                                href="/destinations"
                                className="inline-block gold-gradient text-black px-12 py-4 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                            >
                                Explore Destinations →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sidebar Utility - Sticky */}
                <aside className="space-y-8 relative">
                    <div className="p-6 border border-[#222] rounded-xl bg-[#0a0a0a] sticky top-28">
                        <h3 className="text-[#d4af37] font-bold mb-4 uppercase text-xs tracking-widest text-glow">GTH Authority</h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">Expertly curated by the GTH Pro AI Engine. Privacy is our priority.</p>
                        <div className="space-y-4">
                            <p className="text-xs text-[#d4af37] font-bold uppercase tracking-wide">Insider Updates</p>
                            <div className="h-[1px] bg-[#222] w-full"></div>
                            <p className="text-gray-400 text-xs italic">"Bespoke is not a product, it's a standard."</p>
                        </div>
                    </div>
                </aside>
            </div>

            <Footer />
        </main>
    );
}