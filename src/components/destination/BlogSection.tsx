"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface Blog {
    slug: string
    title: string
    image?: string
    excerpt?: string
}

interface BlogSectionProps {
    blogs: Blog[]
}

export default function BlogSection({
    blogs
}: BlogSectionProps) {

    if (!blogs?.length) return null

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-16 md:py-24">

            {/* ATMOSPHERE */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[var(--surface-2)] blur-[120px]" />

                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--surface-1)] blur-[140px]" />

            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">

                {/* HEADER */}
                <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

                    <div className="max-w-3xl">

                        <div className="gth-glass mb-5 inline-flex items-center rounded-full border border-[var(--border)] px-5 py-2">

                            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-soft)]">
                                GTH Editorial Ecosystem
                            </span>

                        </div>

                        <h2 className="max-w-2xl text-4xl font-black tracking-tight text-[var(--text)] md:text-6xl md:leading-[0.95]">

                            Stories crafted for the{" "}

                            <span className="gold-text">
                                modern global explorer
                            </span>

                        </h2>

                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-soft)] md:text-lg">

                            Discover cinematic destination narratives,
                            elite travel intelligence, premium itineraries,
                            hidden luxury escapes and global lifestyle
                            inspiration curated by the GTH ecosystem.

                        </p>

                    </div>

                    <div className="flex flex-shrink-0 items-center overflow-x-auto scrollbar-hide">

                        <Link
                            href="/blog"
                            className="gth-btn whitespace-nowrap rounded-full px-7 py-3 text-sm font-bold tracking-[0.08em]"
                        >
                            Explore All Guides
                        </Link>

                    </div>

                </header>

                {/* FEATURED GRID */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

                    {/* FEATURED STORY */}
                    {blogs[0] && (

                        <Link
                            href={`/blog/${blogs[0].slug}`}
                            className="group relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] lg:col-span-7"
                        >

                            <div className="relative h-[540px] overflow-hidden">

                                <Image
                                    src={
                                        blogs[0].image ||
                                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop"
                                    }
                                    alt={blogs[0].title}
                                    fill
                                    priority
                                    sizes="(max-width:1024px) 100vw, 58vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.72)] via-[rgba(0,0,0,0.18)] to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">

                                    <div className="gth-glass mb-5 inline-flex items-center rounded-full border border-[var(--stroke-soft)] px-4 py-2">

                                        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text)]">
                                            Featured Editorial
                                        </span>

                                    </div>

                                    <h3 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl md:leading-[1]">

                                        {blogs[0].title}

                                    </h3>

                                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">

                                        {blogs[0].excerpt ||
                                            "Curated travel intelligence, luxury destination insights and editorial storytelling from the world's most premium experiences."}

                                    </p>

                                    <div className="mt-8 flex items-center justify-between">

                                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">

                                            Global Luxury Journal

                                        </span>

                                        <div className="gth-btn-gold flex h-14 w-14 items-center justify-center rounded-full">

                                            <ArrowUpRight size={20} />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </Link>

                    )}

                    {/* SIDE STORIES */}
                    <div className="grid grid-cols-1 gap-6 lg:col-span-5">

                        {blogs.slice(1, 3).map((blog) => (

                            <Link
                                key={blog.slug}
                                href={`/blog/${blog.slug}`}
                                className="group gth-card-premium gth-glass relative overflow-hidden rounded-[30px] border border-[var(--border)]"
                            >

                                <div className="flex h-full flex-col md:flex-row">

                                    {/* IMAGE */}
                                    <div className="relative h-[260px] w-full overflow-hidden md:h-auto md:w-[42%] md:flex-shrink-0">

                                        <Image
                                            src={
                                                blog.image ||
                                                "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1600&auto=format&fit=crop"
                                            }
                                            alt={blog.title}
                                            fill
                                            loading="lazy"
                                            sizes="(max-width:768px) 100vw, 25vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent" />

                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex flex-1 flex-col justify-between p-6 md:p-7">

                                        <div>

                                            <div className="gth-glass mb-5 inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2">

                                                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                                    Editorial Insight
                                                </span>

                                            </div>

                                            <h3 className="text-2xl font-black tracking-tight text-[var(--text)] transition-opacity duration-300 group-hover:opacity-80">

                                                {blog.title}

                                            </h3>

                                            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--text-soft)]">

                                                {blog.excerpt ||
                                                    "Elite destination discoveries, luxury experiences and modern travel inspiration from the GTH ecosystem."}

                                            </p>

                                        </div>

                                        <div className="mt-8 flex items-center justify-between">

                                            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-soft)]">

                                                Premium Story

                                            </span>

                                            <div className="flex items-center gap-3">

                                                <span className="gth-btn-gold rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]">

                                                    Read

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </Link>

                        ))}

                    </div>

                </div>

                {/* DISCOVERY STRIP */}
                <div className="mt-14 overflow-x-auto scrollbar-hide">

                    <div className="flex min-w-max gap-4">

                        {[
                            "Luxury Destinations",
                            "Elite Hotels",
                            "Private Islands",
                            "Global Escapes",
                            "Premium Experiences",
                            "Travel Intelligence",
                            "Luxury Lifestyle",
                            "Hidden Gems"
                        ].map((item) => (

                            <div
                                key={item}
                                className="gth-glass flex-shrink-0 rounded-full border border-[var(--border)] px-5 py-3"
                            >

                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">
                                    {item}
                                </span>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

        </section>

    )

}