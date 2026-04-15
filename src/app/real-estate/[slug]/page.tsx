import { Suspense } from "react"
import type { Metadata } from "next"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"

// ============================
// 🔍 SEO METADATA (Dynamic)
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
        },
    }
}

// ============================
// ⚡ PAGE
// ============================
export default function Page({ params }: any) {
    const slug = params.slug

    return (
        <div className="bg-[#0a0f14] min-h-screen text-white">

            {/* 🔥 Suspense for smoother loading */}
            <Suspense
                fallback={
                    <div className="p-6 animate-pulse space-y-4">
                        <div className="h-6 w-1/2 bg-slate-800 rounded"></div>
                        <div className="h-64 bg-slate-800 rounded"></div>
                        <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                        <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                    </div>
                }
            >
                <PropertyDetailClient slug={slug} />
            </Suspense>

        </div>
    )
}