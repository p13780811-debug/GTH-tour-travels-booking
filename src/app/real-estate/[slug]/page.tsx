import { Suspense } from "react"
import type { Metadata } from "next"

import {
    Sparkles,
    ShieldCheck,
    BrainCircuit,
    TrendingUp,
    ArrowRight,
    Crown,
} from "lucide-react"

import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"
import SimilarProperties from "@/components/real-estate/SimilarProperties"
import AIRecommendations from "@/components/real-estate/AIRecommendations"
import PremiumBoostBanner from "@/components/real-estate/PremiumBoostBanner"

// ============================
// 🔍 PREMIUM SEO METADATA
// ============================

export async function generateMetadata({ params }: any): Promise<Metadata> {

    const { slug: rawSlug } = await params

    const slug =
        rawSlug?.replace(/-/g, " ") || "Luxury Property"

    return {
        title: `${slug} | Luxury Real Estate | GTH ProEstate`,
        description:
            `Explore ${slug} with AI insights, premium visuals, smart recommendations, maps, pricing intelligence and ultra luxury real estate experience on GTH ProEstate.`,

        keywords: [
            "luxury property",
            "real estate",
            "premium homes",
            "buy property",
            "smart real estate",
            "AI real estate",
            "villa",
            "commercial property",
        ],

        openGraph: {
            title: `${slug} | GTH ProEstate`,
            description:
                `Discover premium property experience powered by AI and immersive luxury UI.`,
            type: "website",
            images: [
                {
                    url: `https://source.unsplash.com/1600x900/?luxury-house,villa`,
                    width: 1600,
                    height: 900,
                },
            ],
        },

        twitter: {
            card: "summary_large_image",
            title: `${slug} | GTH ProEstate`,
            description:
                `AI Powered Premium Real Estate Experience`,
        },

        alternates: {
            canonical:
                `https://gth-tour-travels-booking.vercel.app/real-estate/${rawSlug}`,
        },
    }
}

// ============================
// 🚀 PAGE
// ============================

export default async function Page({ params }: any) {

    const { slug } = await params

    const user = null

    return (

        <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">

            {/* ============================ */}
            {/* GLOBAL BACKGROUND FX */}
            {/* ============================ */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute top-[-200px] left-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute right-[-120px] top-[20%] h-[380px] w-[380px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                <div className="absolute bottom-[-180px] left-[25%] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-3xl" />

                <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:70px_70px]" />

            </div>

            {/* ============================ */}
            {/* STRUCTURED DATA */}
            {/* ============================ */}

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        name: slug,
                        category: "Luxury Real Estate",
                        brand: "GTH ProEstate",
                    }),
                }}
            />

            {/* ============================ */}
            {/* TOP PREMIUM STRIP */}
            {/* ============================ */}

            <div className="relative z-20 border-b border-[var(--border)] bg-black/20 backdrop-blur-2xl">

                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-3 text-center">

                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">

                        <BrainCircuit size={14} />

                        AI Powered Matching

                    </div>

                    <div className="hidden h-4 w-px bg-white/10 md:block" />

                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-[#d4af37]">

                        <ShieldCheck size={14} />

                        Verified Luxury Listings

                    </div>

                    <div className="hidden h-4 w-px bg-white/10 md:block" />

                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">

                        <TrendingUp size={14} />

                        Smart Market Analytics

                    </div>

                </div>

            </div>

            {/* ============================ */}
            {/* MAIN PROPERTY */}
            {/* ============================ */}

            <div className="relative z-10">

                <Suspense
                    fallback={

                        <div className="mx-auto max-w-7xl px-4 py-10">

                            <div className="animate-pulse space-y-6">

                                <div className="h-10 w-[320px] rounded-2xl bg-white/10" />

                                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

                                    <div className="space-y-6">

                                        <div className="h-[520px] rounded-[36px] bg-white/10" />

                                        <div className="h-[220px] rounded-[36px] bg-white/10" />

                                    </div>

                                    <div className="space-y-6">

                                        <div className="h-[260px] rounded-[36px] bg-white/10" />

                                        <div className="h-[180px] rounded-[36px] bg-white/10" />

                                    </div>

                                </div>

                            </div>

                        </div>

                    }
                >

                    <PropertyDetailClient slug={slug} />

                </Suspense>

            </div>

            {/* ============================ */}
            {/* PREMIUM BOOST SECTION */}
            {/* ============================ */}

            <section className="relative z-20 mt-16 px-4">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-6 flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">

                            <Crown size={22} />

                        </div>

                        <div>

                            <h2 className="text-2xl font-black tracking-tight md:text-3xl">

                                Premium Visibility Engine

                            </h2>

                            <p className="mt-1 text-sm text-[var(--muted)]">

                                Dominate search rankings with AI boosted exposure

                            </p>

                        </div>

                    </div>

                    <PremiumBoostBanner slug={slug} />

                </div>

            </section>

            {/* ============================ */}
            {/* AI RECOMMENDATIONS */}
            {/* ============================ */}

            <section className="relative z-20 mt-20 px-4">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                        <div>

                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">

                                <Sparkles size={14} />

                                AI Recommendation Matrix

                            </div>

                            <h2 className="text-3xl font-black tracking-tight md:text-5xl">

                                Smart Picks
                                <span className="gold-text"> For You</span>

                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">

                                Our recommendation engine analyzes viewing
                                behavior, pricing trends, property similarity,
                                location value and demand patterns to generate
                                ultra relevant luxury suggestions.

                            </p>

                        </div>

                        <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 backdrop-blur-2xl md:flex">

                            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--muted)]">

                                Powered By GTH AI

                            </span>

                            <ArrowRight size={16} className="text-cyan-400" />

                        </div>

                    </div>

                    <AIRecommendations slug={slug} user={user} />

                </div>

            </section>

            {/* ============================ */}
            {/* SIMILAR PROPERTIES */}
            {/* ============================ */}

            <section className="relative z-20 mt-20 px-4 pb-32">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                        <div>

                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">

                                <Sparkles size={14} />

                                Similar Luxury Inventory

                            </div>

                            <h2 className="text-3xl font-black tracking-tight md:text-5xl">

                                Related
                                <span className="gold-text"> Properties</span>

                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">

                                Discover nearby premium properties with similar
                                pricing, architecture, amenities, investment
                                value and buyer interest.

                            </p>

                        </div>

                    </div>

                    <SimilarProperties slug={slug} user={user} />

                </div>

            </section>

            {/* ============================ */}
            {/* MOBILE FLOAT CTA */}
            {/* ============================ */}

            <div className="fixed bottom-0 left-0 z-[999] w-full border-t border-white/10 bg-black/60 p-3 backdrop-blur-3xl md:hidden">

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">

                    <div>

                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">

                            Premium Assistance

                        </p>

                        <p className="mt-1 text-sm font-bold text-white">

                            Talk to AI & connect instantly

                        </p>

                    </div>

                    <a
                        href="#top"
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_10px_30px_rgba(0,255,255,0.35)] transition-all duration-500 active:scale-95"
                    >

                        Explore

                        <ArrowRight size={15} />

                    </a>

                </div>

            </div>

        </div>
    )
}