import { Suspense } from "react"
import type { Metadata } from "next"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"
import SimilarProperties from "@/components/real-estate/SimilarProperties"
import AIRecommendations from "@/components/real-estate/AIRecommendations"
import PremiumBoostBanner from "@/components/real-estate/PremiumBoostBanner"

// ============================
// 🔍 SEO METADATA (UPGRADED++)
// ============================
export async function generateMetadata({ params }: any): Promise<Metadata> {
    const slug = params.slug?.replace(/-/g, " ") || "Property"

    return {
        title: `${slug} Property Details | GTH ProEstate`,
        description: `Explore ${slug} property with pricing, location, images and direct contact. Find best deals on GTH ProEstate.`,

        openGraph: {
            title: `${slug} Property | GTH ProEstate`,
            description: `View full details of ${slug} property including price, location and images.`,
            type: "website",
            images: [
                {
                    url: `https://source.unsplash.com/1200x630/?house,real-estate`,
                    width: 1200,
                    height: 630,
                }
            ]
        },

        alternates: {
            canonical: `https://gth-tour-travels-booking.vercel.app/real-estate/${params.slug}`,
        },
    }
}

// ============================
// ⚡ PAGE
// ============================
export default function Page({ params }: any) {
    const slug = params.slug

    const user = null // 🔥 later replace with Supabase auth

    return (
        <div className="bg-[#0a0f14] min-h-screen text-white">

            {/* 🧠 STRUCTURED DATA (SEO BOOST) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        name: slug,
                        category: "Real Estate",
                        brand: "GTH ProEstate",
                    })
                }}
            />

            {/* 🔥 MAIN PROPERTY */}
            <Suspense
                fallback={
                    <div className="p-6 animate-pulse space-y-4">
                        <div className="h-6 w-1/2 gth-glass rounded"></div>
                        <div className="h-64 gth-glass rounded"></div>
                        <div className="h-4 w-3/4 gth-glass rounded"></div>
                        <div className="h-4 w-1/2 gth-glass rounded"></div>
                    </div>
                }
            >
                <PropertyDetailClient slug={slug} />
            </Suspense>

            {/* 💰 PREMIUM BOOST CTA */}
            <div className="max-w-6xl mx-auto px-4 mt-10">
                <PremiumBoostBanner slug={slug} />
            </div>

            {/* 🧠 AI RECOMMENDATIONS */}
            <div className="max-w-6xl mx-auto px-4 mt-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🤖 AI Recommended For You
                    <span className="text-xs text-cyan-400">Smart Feed</span>
                </h2>

                <AIRecommendations slug={slug} user={user} />
            </div>

            {/* 🎬 NETFLIX STYLE SECTION */}
            <div className="max-w-6xl mx-auto px-4 mt-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🎬 Similar Properties
                    <span className="text-xs text-gray-400">Based on this listing</span>
                </h2>

                <SimilarProperties slug={slug} user={user} />
            </div>

            {/* 📌 STICKY MOBILE CTA (CONVERSION BOOST 🔥) */}
            <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-3 flex justify-between items-center md:hidden z-50">

                <span className="text-sm text-white">
                    Interested in this property?
                </span>

                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="bg-cyan-500 text-black px-4 py-2 rounded font-bold text-sm"
                >
                    Contact Now
                </button>
            </div>

        </div>
    )
}