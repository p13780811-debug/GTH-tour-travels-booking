import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Globe2, Sparkles, ArrowRight, Stars, Compass, Plane } from "lucide-react"

import LuxuryCard from "@/components/cards/LuxuryCard"
import { supabase } from "@/lib/supabase"

export const revalidate = 60

export const metadata: Metadata = {
    title: "Luxury Destinations | GTH Global Escapes",
    description:
        "Explore elite destinations, cinematic travel experiences, luxury escapes, and AI-powered travel discovery with the GTH Global Ecosystem.",
    keywords: [
        "Luxury Destinations",
        "Elite Travel Ecosystem",
        "GTH Global Escapes",
        "Premium Travel",
        "Luxury Holidays",
        "Global Travel Platform",
        "Luxury Tourism",
        "AI Travel Discovery",
    ],
    openGraph: {
        title: "Luxury Destinations | GTH Global Escapes",
        description:
            "Discover premium destinations and cinematic travel experiences across the globe.",
        type: "website",
    },
    alternates: {
        canonical: "/destinations",
    },
}

type Destination = {
    id?: string
    slug: string
    title: string
    location?: string
    image?: string
    description?: string
}

const featuredDestinations = [
    {
        slug: "dubai",
        title: "Dubai",
        image:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
    },
    {
        slug: "paris",
        title: "Paris",
        image:
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop",
    },
    {
        slug: "bali",
        title: "Bali",
        image:
            "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1600&auto=format&fit=crop",
    },
    {
        slug: "maldives",
        title: "Maldives",
        image:
            "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=1600&auto=format&fit=crop",
    },
]

const premiumFallbacks = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1600&auto=format&fit=crop",
]

export default async function DestinationsPage() {

    let destinations: Destination[] = []

    try {

        const { data, error } = await supabase
            .from("destinations")
            .select("*")
            .order("created_at", {
                ascending: false,
            })
            .limit(7)

        if (error) {
            throw error
        }

        destinations = data || []

    } catch (error) {

        console.error(
            "DESTINATION_FETCH_ERROR",
            error
        )
    }

    return (

        <main className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">

            {/* GLOBAL AMBIENCE */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[var(--text)]/5 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-[340px] w-[340px] rounded-full bg-[var(--text)]/5 blur-3xl" />

            </div>

            {/* HERO */}
            <section className="relative z-10 px-3 pt-3 md:px-5 md:pt-5">

                <div className="relative mx-auto overflow-hidden rounded-[38px] border border-[var(--border)] bg-[var(--card)] xl:max-w-[1700px]">

                    {/* BG IMAGE */}
                    <div className="absolute inset-0">

                        <Image
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2400&auto=format&fit=crop"
                            alt="Luxury Global Escapes"
                            fill
                            priority
                            className="object-cover object-center"
                        />

                        <div className="absolute inset-0 bg-[var(--bg)]/20" />

                        <div className="absolute inset-y-0 left-0 hidden w-[56%] bg-[var(--bg)]/10 xl:block" />

                        <div className="absolute inset-0 xl:hidden bg-[var(--bg)]/20" />

                    </div>

                    {/* TOP STATUS */}
                    <div className="absolute left-4 right-4 top-4 z-40 md:left-6 md:right-6">

                        <div className="flex items-center justify-between gap-3">

                            <div className="gth-glass flex h-11 items-center gap-3 rounded-full border border-[var(--border)] px-5">

                                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--text)]" />

                                <span className="text-[10px] tracking-[0.26em] text-[var(--text-soft)]">
                                    GLOBAL DISCOVERY ACTIVE
                                </span>

                            </div>

                            <div className="hidden md:flex gth-glass h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5">

                                <Sparkles
                                    size={14}
                                    className="text-[var(--text)]"
                                />

                                <span className="text-[10px] tracking-[0.22em] text-[var(--text-soft)]">
                                    AI POWERED ROUTING
                                </span>

                            </div>

                        </div>

                    </div>

                    {/* HERO CONTENT */}
                    <div className="relative z-20 flex min-h-[920px] flex-col justify-between xl:min-h-[760px] xl:flex-row">

                        {/* LEFT */}
                        <div className="flex w-full flex-col justify-center px-5 pb-[160px] pt-[150px] md:px-10 xl:w-[58%] xl:px-16 xl:pb-20 xl:pt-20">

                            <div className="max-w-[760px]">

                                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] gth-glass px-5 py-3">

                                    <Stars
                                        size={14}
                                        className="text-[var(--text)]"
                                    />

                                    <span className="text-[10px] tracking-[0.32em] text-[var(--text-soft)]">
                                        GTH GLOBAL ESCAPES
                                    </span>

                                </div>

                                <h1 className="mt-7 max-w-[10ch] text-[52px] font-light leading-[0.9] tracking-[-0.08em] text-[var(--text)] md:text-[74px] xl:text-[92px]">

                                    Discover cinematic luxury destinations.

                                </h1>

                                <p className="mt-7 max-w-[60ch] text-[15px] leading-8 text-[var(--text-soft)]">

                                    Explore elite travel ecosystems,
                                    private stays, global experiences,
                                    cinematic journeys, and AI-powered
                                    destination discovery designed for
                                    modern luxury travellers.

                                </p>

                                {/* CTA */}
                                <div className="mt-10 flex flex-wrap items-center gap-4">

                                    <Link
                                        href="/tours"
                                        className="gth-btn-gold flex h-14 items-center gap-2 rounded-full px-8 text-[10px] font-black tracking-[0.24em]"
                                    >

                                        Explore Escapes

                                        <ArrowRight size={14} />

                                    </Link>

                                    <Link
                                        href="/hotels"
                                        className="gth-glass flex h-14 items-center rounded-full border border-[var(--border)] px-8 text-[10px] font-black tracking-[0.24em] text-[var(--text)]"
                                    >

                                        Luxury Hotels

                                    </Link>

                                </div>

                            </div>

                        </div>

                        {/* RIGHT PANEL */}
                        <div className="hidden xl:flex flex-1 items-center justify-end pr-10">

                            <div className="w-full max-w-[390px] rounded-[34px] border border-[var(--border)] gth-glass p-5">

                                <div className="mb-5 flex items-center justify-between">

                                    <div>

                                        <p className="text-[10px] tracking-[0.28em] text-[var(--text-soft)]">
                                            GLOBAL DISCOVERY
                                        </p>

                                        <h3 className="mt-2 text-[32px] font-light tracking-[-0.05em] text-[var(--text)]">
                                            Explore World
                                        </h3>

                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/10">

                                        <Compass
                                            size={18}
                                            className="text-[var(--text)]"
                                        />

                                    </div>

                                </div>

                                <div className="space-y-4">

                                    {featuredDestinations.map((item) => (

                                        <Link
                                            key={item.slug}
                                            href={`/destinations/${item.slug}`}
                                            className="group flex items-center gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--bg)]/10 p-3 transition-all duration-300 hover:translate-x-1"
                                        >

                                            <div className="relative h-[78px] w-[78px] overflow-hidden rounded-[20px]">

                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover transition duration-700 group-hover:scale-105"
                                                />

                                            </div>

                                            <div className="flex-1">

                                                <p className="text-[10px] tracking-[0.24em] text-[var(--text-soft)]">
                                                    PREMIUM DESTINATION
                                                </p>

                                                <h4 className="mt-2 text-xl font-semibold text-[var(--text)]">
                                                    {item.title}
                                                </h4>

                                            </div>

                                            <ArrowRight
                                                size={16}
                                                className="text-[var(--text-soft)]"
                                            />

                                        </Link>

                                    ))}

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* SEARCH BAR */}
                    <div className="absolute bottom-4 left-1/2 z-40 w-[94%] -translate-x-1/2 xl:max-w-[1220px]">

                        <div className="rounded-[30px] border border-[var(--border)] gth-glass p-3">

                            <div className="flex flex-col gap-3 xl:flex-row">

                                <div className="flex h-[68px] flex-1 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--bg)]/10 px-5">

                                    <Globe2
                                        size={18}
                                        className="text-[var(--text-soft)]"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Search destinations, luxury stays & cinematic experiences..."
                                        className="h-full w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)]"
                                    />

                                </div>

                                <button className="gth-btn-gold h-[68px] rounded-[22px] px-10 text-[10px] font-black tracking-[0.24em] whitespace-nowrap">

                                    Explore Now

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* FEATURED STRIP */}
            <section className="relative z-10 pt-20">

                <div className="mx-auto max-w-7xl px-5 md:px-8">

                    <div className="flex items-end justify-between">

                        <div>

                            <p className="text-[10px] tracking-[0.32em] text-[var(--text-soft)]">
                                GLOBAL COLLECTION
                            </p>

                            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                                Featured Escapes
                            </h2>

                        </div>

                        <Link
                            href="/tours"
                            className="hidden md:inline-flex text-sm font-bold text-[var(--text-soft)]"
                        >
                            View Collection
                        </Link>

                    </div>

                    <div className="mt-10 flex gap-5 overflow-x-auto pb-2 scrollbar-hide">

                        {featuredDestinations.map((item) => (

                            <Link
                                key={item.slug}
                                href={`/destinations/${item.slug}`}
                                className="group relative h-[420px] w-[300px] flex-shrink-0 overflow-hidden rounded-[34px] border border-[var(--border)]"
                            >

                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    loading="lazy"
                                    className="object-cover transition duration-700 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-[var(--bg)]/20" />

                                <div className="absolute inset-x-0 bottom-0 p-6">

                                    <div className="inline-flex items-center gap-2 rounded-full gth-glass border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]">

                                        <MapPin size={12} />

                                        Trending Escape

                                    </div>

                                    <h3 className="mt-4 text-4xl font-black tracking-tight text-[var(--text)]">
                                        {item.title}
                                    </h3>

                                </div>

                            </Link>

                        ))}

                    </div>

                </div>

            </section>

            {/* GRID */}
            <section className="relative z-10 py-24">

                <div className="mx-auto max-w-7xl px-5 md:px-8">

                    <div className="mb-14">

                        <p className="text-[10px] tracking-[0.32em] text-[var(--text-soft)]">
                            CURATED DESTINATIONS
                        </p>

                        <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                            Luxury Destination Collection
                        </h2>

                        <p className="mt-6 max-w-3xl text-[15px] leading-8 text-[var(--text-soft)]">

                            Discover curated destinations,
                            cinematic landscapes, luxury stays,
                            premium experiences, and intelligent
                            travel discovery within the GTH ecosystem.

                        </p>

                    </div>

                    {destinations.length > 0 && (

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                            {destinations.map((destination, index) => {

                                const dynamicImage =
                                    destination.image ||
                                    premiumFallbacks[index % premiumFallbacks.length]

                                return (

                                    <article
                                        key={destination.slug}
                                        className={`group relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] transition-all duration-500 hover:-translate-y-1 ${index === 0
                                            ? "md:col-span-2 md:row-span-2"
                                            : ""
                                            }`}
                                    >

                                        <Link
                                            href={`/destinations/${destination.slug}`}
                                            className="block h-full"
                                        >

                                            <div className={`relative overflow-hidden ${index === 0
                                                ? "h-[560px]"
                                                : "h-[340px]"
                                                }`}>

                                                <Image
                                                    src={dynamicImage}
                                                    alt={destination.title || "Global Destination"} // ✅ Alt bug fixed permanently
                                                    fill
                                                    priority={index === 0}
                                                    className="object-cover transition duration-700 group-hover:scale-105"
                                                />

                                                <div className="absolute inset-0 bg-[var(--bg)]/20" />

                                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">

                                                    <div className="inline-flex items-center gap-2 rounded-full gth-glass border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]">

                                                        <MapPin size={12} />

                                                        {destination.location || "Global Destination"}

                                                    </div>

                                                    <h3 className={`mt-5 font-black tracking-tight text-[var(--text)] ${index === 0
                                                        ? "text-4xl md:text-6xl"
                                                        : "text-3xl"
                                                        }`}>

                                                        {destination.title}

                                                    </h3>

                                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">

                                                        {destination.description ||
                                                            "Experience curated luxury escapes and cinematic travel discovery."}

                                                    </p>

                                                </div>

                                            </div>

                                        </Link>

                                    </article>

                                )

                            })}

                        </div>

                    )}

                </div>

            </section>

        </main>

    )
}