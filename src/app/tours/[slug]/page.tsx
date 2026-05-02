import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import RelatedCarousel from "@/components/RelatedCarousel"


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const dynamic = "force-dynamic"

export default async function Page({ params }: any) {

    const { slug } = await params

    const symbolMap: any = {
        INR: "₹",
        USD: "$",
        EUR: "€"
    };

    // 🔥 MAIN TOUR
    const { data: tour } = await supabase
        .from("tours")
        .select("*")
        .eq("city_slug", slug)
        .single()

    if (!tour) {
        return <div className="text-white p-10">Tour not found</div>
    }

    // 🔥 SMART AI-LIKE RELATED SYSTEM

    // normalize price range
    const basePrice = tour.price_numeric || 0;
    const minPrice = basePrice * 0.7;
    const maxPrice = basePrice * 1.3;

    // 🔥 1. SAME CITY (BEST MATCH)
    let { data: related } = await supabase
        .from("tours")
        .select("*")
        .neq("id", tour.id)
        .eq("city_slug", slug)
        .limit(12)

    // 🔥 2. SAME COUNTRY + PRICE RANGE
    if (!related || related.length < 2) {
        const { data: fallback1 } = await supabase
            .from("tours")
            .select("*")
            .neq("id", tour.id)
            .eq("country", tour.country)
            .gte("price_numeric", minPrice)
            .lte("price_numeric", maxPrice)
            .limit(4)

        related = [...(related || []), ...(fallback1 || [])]
    }

    // 🔥 3. TITLE KEYWORD MATCH (AI FEEL 😈)
    if (!related || related.length < 3) {
        const keyword = tour.title.split(" ")[0] // simple keyword

        const { data: fallback2 } = await supabase
            .from("tours")
            .select("*")
            .ilike("title", `%${keyword}%`)
            .neq("id", tour.id)
            .limit(4)

        related = [...(related || []), ...(fallback2 || [])]
    }

    // 🔥 4. FINAL RANDOM FILL (NEVER EMPTY)
    if (!related || related.length < 4) {
        const { data: fallback3 } = await supabase
            .from("tours")
            .select("*")
            .neq("id", tour.id)
            .limit(6)

        related = [...(related || []), ...(fallback3 || [])]
    }

    // 🔥 REMOVE DUPLICATES + LIMIT
    const uniqueMap = new Map()
    related?.forEach((item: any) => {
        if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item)
        }
    })

    const LIMIT = 12
    related = Array.from(uniqueMap.values()).slice(0, LIMIT)

    // 🔥 FALLBACK AFFILIATE
    const affiliate =
        tour.affiliate_link ||
        `https://www.partner-site.com/search?city=${slug}&ref=GTHPRO`

    return (
        <div className="min-h-screen bg-black text-white">

            {/* 🔥 HERO */}
            <div className="relative h-[420px] w-full flex items-center justify-center">

                <img
                    src={tour.image_url}
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />

                <div className="absolute inset-0 bg-naviblue"></div>

                <div className="relative z-10 text-center px-4">

                    <h1 className="text-4xl md:text-6xl font-black">
                        {tour.title}
                    </h1>

                    <p className="text-yellow-500 text-2xl mt-2 font-bold">
                        {symbolMap[tour.currency] || "₹"}{tour.price_numeric ?? 0}
                    </p>

                    <a
                        href={affiliate}
                        target="_blank"
                        className="inline-block mt-6 gth-btn-gold text-black px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition"
                    >
                        Book Now →
                    </a>

                    <p className="text-sm text-gray-400 mt-3">
                        ⚡ Limited seats | Best price guarantee
                    </p>

                </div>
            </div>

            {/* 🔥 MAIN CONTENT */}
            <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">

                {/* LEFT */}
                <div className="md:col-span-2">

                    {/* DESCRIPTION */}
                    <div className="bg-naviblue p-6 rounded-xl border border-white/5">
                        <h2 className="text-xl font-bold mb-3">About this tour</h2>
                        <p className="text-gray-400">
                            Explore the beauty of {slug}. Premium curated experience with best deals and verified partners.
                        </p>
                    </div>

                    {/* 🔥 HIGHLIGHTS */}
                    <div className="mt-6 bg-naviblue p-6 rounded-xl border border-white/5">
                        <h2 className="text-xl font-bold mb-3">Highlights</h2>

                        <ul className="space-y-2 text-gray-300">
                            <li>✔ Top rated experience</li>
                            <li>✔ Instant booking</li>
                            <li>✔ Best price guarantee</li>
                            <li>✔ Trusted partners</li>
                        </ul>
                    </div>

                </div>

                {/* 🔥 RIGHT SIDEBAR (CONVERSION BOX) */}
                <div className="space-y-6">

                    <div className="bg-naviblue p-6 rounded-xl border border-white/5 sticky top-6">

                        <p className="text-2xl font-black text-yellow-500">
                            {symbolMap[tour.currency] || "₹"}{tour.price_numeric ?? 0}
                        </p>

                        <a
                            href={affiliate}
                            target="_blank"
                            className="block mt-6 gth-btn-gold hover:bg-yellow-400 text-black py-4 text-center rounded-xl font-black text-lg transition-all"
                        >
                            Book Now →
                        </a>

                        <p className="text-xs text-gray-400 mt-3">
                            🔒 Secure booking | No hidden charges
                        </p>

                    </div>

                </div>

            </div>


            <RelatedCarousel related={related} symbolMap={symbolMap} />



        </div>

    )
}