import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import { MapPin, Globe2, Sparkles } from "lucide-react"

import LuxuryCard from "@/components/cards/LuxuryCard"

export const revalidate = 60

export const metadata: Metadata = {
    title:
        "Luxury Destinations | GTH Global Escapes",
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
        title:
            "Luxury Destinations | GTH Global Escapes",
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

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

        <main className="relative overflow-hidden min-h-screen bg-[var(--bg)] text-[var(--text)]">

            {/* ========================= */}
            {/* AMBIENT GLOW */}
            {/* ========================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute -top-24 left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-[260px] w-[260px] rounded-full bg-[var(--gold)]/5 blur-3xl" />

            </div>

            {/* ========================= */}
            {/* HERO */}
            {/* ========================= */}

            <header className="relative z-10">

                <section className="mx-auto max-w-7xl px-5 pt-24 pb-14 md:px-8 md:pt-32 md:pb-20">

                    <div className="max-w-4xl">

                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[var(--text-soft)] uppercase backdrop-blur-md">

                            <Sparkles
                                size={14}
                                className="text-[var(--gold)]"
                            />

                            GTH Global Escapes

                        </div>

                        <h1 className="max-w-5xl text-5xl font-black tracking-tight text-[var(--text)] md:text-7xl">

                            Discover the world’s most
                            cinematic luxury destinations.

                        </h1>

                        <div className="mt-5 h-[3px] w-28 rounded-full bg-[var(--gold)]" />

                        <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--text-soft)] md:text-lg">

                            Explore curated global escapes,
                            elite travel ecosystems, premium
                            stays, and immersive experiences
                            designed for modern luxury
                            travelers.

                        </p>

                        {/* SEARCH STYLE BAR */}

                        <div className="mt-10 flex flex-col gap-4 rounded-[30px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] backdrop-blur-xl md:flex-row md:items-center">

                            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-[var(--surface-1)] px-4 py-4">

                                <Globe2
                                    size={20}
                                    className="text-[var(--gold)]"
                                />

                                <input
                                    type="text"
                                    placeholder="Search luxury destinations, islands, experiences..."
                                    className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                                />

                            </div>

                            <button className="flex h-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--gold)] px-8 text-sm font-black tracking-wide text-black transition-all duration-300 hover:scale-[1.01]">

                                Explore Now

                            </button>

                        </div>

                    </div>

                </section>

            </header>

            {/* ========================= */}
            {/* FEATURED STRIP */}
            {/* ========================= */}

            <section className="relative z-10">

                <div className="mx-auto max-w-7xl px-5 md:px-8">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                                Featured Escapes
                            </h2>

                            <p className="mt-2 text-sm text-[var(--text-soft)]">
                                Curated luxury travel discovery
                            </p>

                        </div>

                        <Link
                            href="/tours"
                            className="text-sm font-semibold text-[var(--gold)]"
                        >
                            View all
                        </Link>

                    </div>

                    <div className="mt-8 flex gap-5 overflow-x-auto pb-2 scrollbar-hide">

                        {[
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
                        ].map((item) => (

                            <Link
                                key={item.slug}
                                href={`/destinations/${item.slug}`}
                                className="group relative h-[360px] w-[280px] flex-shrink-0 overflow-hidden rounded-[32px]"
                            >

                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    loading="lazy"
                                    className="object-cover transition duration-700 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-6">

                                    <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-md">

                                        <MapPin size={12} />

                                        Trending Escape

                                    </div>

                                    <h3 className="mt-4 text-3xl font-black tracking-tight text-white">
                                        {item.title}
                                    </h3>

                                </div>

                            </Link>
                        ))}

                    </div>

                </div>

            </section>

            {/* ========================= */}
            {/* DESTINATION GRID */}
            {/* ========================= */}

            <section className="relative z-10 py-20">

                <div className="mx-auto max-w-7xl px-5 md:px-8">

                    <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                        <div>

                            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                                Luxury Destination Collection
                            </h2>

                            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-soft)]">

                                Discover handpicked destinations,
                                premium stays, private experiences,
                                and global escapes designed for
                                elite travelers.

                            </p>

                        </div>

                        <Link
                            href="/guides"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gold)]"
                        >
                            Explore Travel Guides
                        </Link>

                    </div>

                    {/* EMPTY STATE */}

                    {destinations.length === 0 && (

                        <article className="relative overflow-hidden rounded-[40px] border border-[var(--border)] bg-[var(--card)] p-10 shadow-[var(--shadow)] backdrop-blur-xl md:p-16">

                            <div className="absolute top-0 right-0 h-[220px] w-[220px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                            <div className="relative z-10 max-w-2xl">

                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">

                                    <Sparkles
                                        size={14}
                                        className="text-[var(--gold)]"
                                    />

                                    GTH Discovery Engine

                                </div>

                                <h3 className="mt-8 text-4xl font-black tracking-tight">

                                    New luxury destinations are
                                    arriving shortly.

                                </h3>

                                <p className="mt-5 max-w-xl leading-relaxed text-[var(--text-soft)]">

                                    Our global ecosystem is currently
                                    preparing premium destination
                                    experiences, cinematic escapes,
                                    and AI-curated journeys.

                                </p>

                                <div className="mt-8 flex flex-wrap gap-4">

                                    <Link
                                        href="/tours"
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--gold)] px-6 text-sm font-black text-black transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        Explore Tours
                                    </Link>

                                    <Link
                                        href="/hotels"
                                        className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-6 text-sm font-bold text-[var(--text)]"
                                    >
                                        Browse Hotels
                                    </Link>

                                </div>

                            </div>

                        </article>
                    )}

                    {/* BENTO GRID */}
                    {destinations.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {destinations.map((destination, index) => {

                                // ✅ FIX: 7 Ultra-Premium Fallback Images
                                const premiumFallbacks = [
                                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop", // Tropical Beach
                                    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop", // Dubai
                                    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop", // Paris
                                    "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1600&auto=format&fit=crop", // Bali Resort
                                    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1600&auto=format&fit=crop", // Vintage Europe
                                    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1600&auto=format&fit=crop", // Luxury Villa
                                    "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1600&auto=format&fit=crop"  // Mountain Retreat
                                ];

                                // Har card ko ek alag premium image milegi agar DB me nahi hai
                                const dynamicImage = destination.image || premiumFallbacks[index % premiumFallbacks.length];

                                return (
                                    <article
                                        key={destination.slug}
                                        className={`group relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] ${index === 0 ? "md:col-span-2 md:row-span-2" : ""
                                            }`}
                                    >
                                        <Link href={`/destinations/${destination.slug}`} className="block h-full">
                                            <div className={`relative overflow-hidden ${index === 0 ? "h-[520px]" : "h-[320px]"}`}>

                                                <Image
                                                    src={dynamicImage} // ✅ Dynamic Image applied here
                                                    alt={destination.title || "Global Destination"} // ✅ Alt bug fixed permanently
                                                    fill
                                                    priority={index === 0}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    className="object-cover transition duration-700 group-hover:scale-105"
                                                />

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                                                    <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                                        <MapPin size={12} />
                                                        {destination.location || "Global Destination"}
                                                    </div>

                                                    <h3 className={`mt-4 font-black tracking-tight text-white ${index === 0 ? "text-4xl md:text-5xl" : "text-2xl"
                                                        }`}>
                                                        {destination.title}
                                                    </h3>

                                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
                                                        {destination.description || "Experience curated luxury escapes, elite stays, and cinematic travel discovery."}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                </div>

            </section>

            {/* ========================= */}
            {/* DISCOVERY CTA */}
            {/* ========================= */}

            <section className="relative z-10 pb-24">

                <div className="mx-auto max-w-7xl px-5 md:px-8">

                    <div className="relative overflow-hidden rounded-[42px] border border-[var(--border)] bg-[var(--card)] px-6 py-12 shadow-[var(--shadow)] backdrop-blur-xl md:px-14 md:py-16">

                        <div className="absolute right-0 top-0 h-[260px] w-[260px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

                            <div className="max-w-3xl">

                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">

                                    AI Powered Discovery

                                </div>

                                <h2 className="mt-7 text-4xl font-black tracking-tight md:text-6xl">

                                    Your next global escape starts here.

                                </h2>

                                <p className="mt-6 max-w-2xl leading-relaxed text-[var(--text-soft)]">

                                    Discover destinations, luxury stays,
                                    private tours, premium properties,
                                    and intelligent travel planning —
                                    all within the GTH Global Ecosystem.

                                </p>

                            </div>

                            <div className="flex flex-wrap gap-4">

                                <Link
                                    href="/ai-trip"
                                    className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--gold)] px-8 text-sm font-black tracking-wide text-black transition-all duration-300 hover:scale-[1.02]"
                                >
                                    Plan AI Trip
                                </Link>

                                <Link
                                    href="/hotels"
                                    className="inline-flex h-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-8 text-sm font-bold text-[var(--text)]"
                                >
                                    Browse Hotels
                                </Link>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    )
}