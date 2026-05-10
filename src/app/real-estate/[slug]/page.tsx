import { Suspense } from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"

import {
    Sparkles,
    ShieldCheck,
    BrainCircuit,
    TrendingUp,
    Crown,
    ArrowRight,
    BadgeCheck,
    Globe2,
    ScanSearch,
    Star,
    Gem,
} from "lucide-react"

import {
    getPropertyBySlug,
    getSimilarProperties,
    getAIRecommendations,
} from "@/lib/real-estate/propertyService"

const PropertyDetailClient = dynamic(
    () => import("@/components/real-estate/PropertyDetailClient"),
    {
        ssr: true,
        loading: () => (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="gth-glass-ultra flex items-center gap-4 rounded-[32px] px-8 py-6">
                    <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
                    <div>
                        <p className="text-lg font-black text-[var(--text)]">
                            Initializing Estate Engine
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Loading luxury intelligence layer...
                        </p>
                    </div>
                </div>
            </div>
        ),
    }
)


const SimilarProperties = dynamic(
    () => import("@/components/real-estate/SimilarProperties"),
    { ssr: true }
)

const AIRecommendations = dynamic(
    () => import("@/components/real-estate/AIRecommendations"),
    { ssr: true }
)

const PremiumBoostBanner = dynamic(
    () => import("@/components/real-estate/PremiumBoostBanner"),
    { ssr: true }
)

type PageProps = {
    params: Promise<{
        slug: string
    }>
}

/* ================================================= */
/* SEO */
/* ================================================= */

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {

    const { slug } = await params

    const property =
        await getPropertyBySlug(slug)

    const title =
        property?.title ||
        "Luxury Property"

    const description =
        property?.description ||
        "AI powered luxury real estate platform with intelligent recommendations, smart analytics and premium verified listings."

    const image =
        property?.image ||
        "/images/og-real-estate.jpg"

    return {
        title:
            `${title} | GTH PRO Estate`,

        description,

        keywords: [
            "luxury real estate",
            "premium property",
            "AI real estate",
            "villa",
            "commercial",
            "apartments",
            "smart investment",
            "buy property",
            "luxury homes",
        ],

        openGraph: {
            title,
            description,
            images: [
                {
                    url: image,
                    width: 1600,
                    height: 900,
                },
            ],
            type: "website",
        },

        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },

        alternates: {
            canonical:
                `https://gth-tour-travels-booking.vercel.app/real-estate/${slug}`,
        },
    }
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default async function Page({
    params,
}: PageProps) {

    const { slug } = await params

    const property =
        await getPropertyBySlug(slug)

    if (!property) {

        return (

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-6">

                <div className="absolute inset-0 opacity-[0.04] gth-grid-luxury" />

                <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="gth-glass-ultra relative z-10 max-w-2xl rounded-[42px] p-10 text-center">

                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] border border-[var(--border)] bg-[var(--card)]">

                        <ScanSearch
                            size={42}
                            className="text-[var(--gold)]"
                        />

                    </div>

                    <h1 className="mt-8 text-5xl font-black tracking-tight text-[var(--text)]">

                        Property Not Found

                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--muted)]">

                        This listing may have been removed,
                        upgraded or moved into a private premium inventory.

                    </p>

                    <a
                        href="/real-estate"
                        className="gth-btn-gold mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-black uppercase tracking-[0.25em]"
                    >

                        Explore Premium Properties

                        <ArrowRight size={16} />

                    </a>

                </div>

            </div>
        )
    }

    const [similar, recommendations] =
        await Promise.all([
            getSimilarProperties(property.slug),
            getAIRecommendations(property.slug),
        ])

    return (

        <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">

            {/* ================================================= */}
            {/* GLOBAL FX */}
            {/* ================================================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute inset-0 opacity-[0.03] gth-grid-luxury" />

                <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="absolute right-[-200px] top-[10%] h-[460px] w-[460px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-[-180px] left-[20%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />

            </div>

            {/* ================================================= */}
            {/* STRUCTURED DATA */}
            {/* ================================================= */}

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Residence",
                        name: property.title,
                        description: property.description,
                        image: property.image,
                        address: {
                            "@type": "PostalAddress",
                            addressLocality:
                                property.city,
                            addressCountry:
                                property.country,
                        },
                    }),
                }}
            />

            {/* ================================================= */}
            {/* TOP AI STRIP */}
            {/* ================================================= */}

            <div className="relative z-40 border-b border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-3xl">

                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-4">

                    <div className="gth-glass flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400">

                        <BrainCircuit size={14} />

                        AI Market Intelligence

                    </div>

                    <div className="gth-glass flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-400">

                        <ShieldCheck size={14} />

                        Verified Luxury Inventory

                    </div>

                    <div className="gth-glass flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">

                        <TrendingUp size={14} />

                        Smart Price Prediction

                    </div>

                    <div className="gth-glass hidden items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--primary)] lg:flex">

                        <Globe2 size={14} />

                        Global Luxury Ecosystem

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="relative z-20 border-b border-[var(--border)]">

                <div className="mx-auto max-w-7xl px-4 pb-14 pt-14 md:px-6">

                    <div className="flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">

                        <div className="max-w-4xl">

                            <div className="mb-6 flex flex-wrap items-center gap-3">

                                <div className="gth-btn-gold inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em]">

                                    <Crown size={14} />

                                    Premium Estate

                                </div>

                                <div className="gth-glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">

                                    <BadgeCheck size={14} />

                                    AI Verified

                                </div>

                                <div className="gth-glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">

                                    <Sparkles size={14} />

                                    Smart Ranked

                                </div>

                            </div>

                            <h1 className="text-4xl font-black leading-none tracking-[-0.06em] text-[var(--text)] md:text-7xl">

                                {property.title}

                            </h1>

                            <div className="mt-7 flex flex-wrap items-center gap-4">

                                <div className="gth-glass flex items-center gap-3 rounded-full px-6 py-4">

                                    <Globe2
                                        size={18}
                                        className="text-[var(--gold)]"
                                    />

                                    <span className="text-sm font-bold tracking-wide text-[var(--text)]">

                                        {property.location}

                                    </span>

                                </div>

                                <div className="gth-glass flex items-center gap-3 rounded-full px-6 py-4">

                                    <Star
                                        size={18}
                                        className="text-yellow-400"
                                    />

                                    <span className="text-sm font-bold tracking-wide text-[var(--text)]">

                                        AI Score {property.ai_score || 92}/100

                                    </span>

                                </div>

                            </div>

                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                            <div className="gth-glass-ultra rounded-[30px] p-5">

                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">

                                    Price

                                </p>

                                <h3 className="mt-3 text-2xl font-black gold-text">

                                    ₹ {property.price}

                                </h3>

                            </div>

                            <div className="gth-glass-ultra rounded-[30px] p-5">

                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">

                                    Sqft

                                </p>

                                <h3 className="mt-3 text-2xl font-black text-[var(--text)]">

                                    {property.sqft || "--"}

                                </h3>

                            </div>

                            <div className="gth-glass-ultra rounded-[30px] p-5">

                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">

                                    Beds

                                </p>

                                <h3 className="mt-3 text-2xl font-black text-[var(--text)]">

                                    {property.beds || "--"}

                                </h3>

                            </div>

                            <div className="gth-glass-ultra rounded-[30px] p-5">

                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">

                                    Baths

                                </p>

                                <h3 className="mt-3 text-2xl font-black text-[var(--text)]">

                                    {property.baths || "--"}

                                </h3>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* ================================================= */}
            {/* PROPERTY */}
            {/* ================================================= */}

            <main className="relative z-20">

                <Suspense
                    fallback={

                        <div className="mx-auto max-w-7xl px-4 py-16">

                            <div className="animate-pulse space-y-6">

                                <div className="h-[620px] rounded-[40px] bg-[var(--card)]" />

                                <div className="grid gap-6 lg:grid-cols-3">

                                    <div className="h-[220px] rounded-[40px] bg-[var(--card)] lg:col-span-2" />

                                    <div className="h-[220px] rounded-[40px] bg-[var(--card)]" />

                                </div>

                            </div>

                        </div>

                    }
                >

                    <PropertyDetailClient slug={slug} initialData={property} />

                </Suspense>

            </main>

            {/* ================================================= */}
            {/* BOOST */}
            {/* ================================================= */}

            <section className="relative z-20 mt-20 px-4">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-8 flex items-center gap-4">

                        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-[var(--premium-gradient)] text-black shadow-[var(--shadow-gold)]">

                            <Gem size={28} />

                        </div>

                        <div>

                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--gold)]">

                                AI Visibility Engine

                            </p>

                            <h2 className="mt-2 text-4xl font-black tracking-tight text-[var(--text)]">

                                Premium Boost Layer

                            </h2>

                        </div>

                    </div>

                    <PremiumBoostBanner
                        slug={slug}
                    />

                </div>

            </section>

            {/* ================================================= */}
            {/* AI RECOMMENDATIONS */}
            {/* ================================================= */}

            <section className="relative z-20 mt-24 px-4">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                        <div className="max-w-3xl">

                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400">

                                <BrainCircuit size={14} />

                                Neural Recommendation Engine

                            </div>

                            <h2 className="mt-6 text-5xl font-black tracking-tight text-[var(--text)]">

                                AI Smart Picks

                            </h2>

                            <p className="mt-5 text-base leading-8 text-[var(--muted)]">

                                Hyper-personalized recommendations powered by live behavior analysis, pricing intelligence and luxury ranking systems.

                            </p>

                        </div>

                    </div>

                    <AIRecommendations
                        items={recommendations}
                    />

                </div>

            </section>

            {/* ================================================= */}
            {/* SIMILAR */}
            {/* ================================================= */}

            <section className="relative z-20 mt-24 px-4 pb-32">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                        <div className="max-w-3xl">

                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">

                                <Sparkles size={14} />

                                Similar Luxury Inventory

                            </div>

                            <h2 className="mt-6 text-5xl font-black tracking-tight text-[var(--text)]">

                                Related Properties

                            </h2>

                            <p className="mt-5 text-base leading-8 text-[var(--muted)]">

                                Explore nearby premium listings with matching architecture, demand score and investment potential.

                            </p>

                        </div>

                    </div>

                    <SimilarProperties
                        items={similar}
                    />

                </div>

            </section>

        </div>
    )
}