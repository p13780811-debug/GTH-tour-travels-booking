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
        .select("id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link")
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
        .select("id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link")
        .neq("id", tour.id)
        .eq("city_slug", slug)
        .limit(12)

    // 🔥 2. SAME COUNTRY + PRICE RANGE
    if (!related || related.length < 2) {
        const { data: fallback1 } = await supabase
            .from("tours")
            .select("id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link")
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
            .select("id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link")
            .ilike("title", `%${keyword}%`)
            .neq("id", tour.id)
            .limit(4)

        related = [...(related || []), ...(fallback2 || [])]
    }

    // 🔥 4. FINAL RANDOM FILL (NEVER EMPTY)
    if (!related || related.length < 4) {
        const { data: fallback3 } = await supabase
            .from("tours")
            .select("id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link")
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

    // Only known travel partner destinations may be used for external checkout.
    const allowedHosts = ["klook.com", "trip.com", "booking.com", "hotellook.com", "tp.media", "tpo.lv"];
    let affiliate: string | null = null;
    if (typeof tour.affiliate_link === "string" && tour.affiliate_link.length <= 2048) {
        try {
            const url = new URL(tour.affiliate_link);
            const host = url.hostname.toLowerCase();
            if (url.protocol === "https:" && !url.username && !url.password &&
                allowedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
                affiliate = url.toString();
            }
        } catch {
            affiliate = null;
        }
    }

    const listedPrice = Number(tour.price_numeric) > 0
        ? `${symbolMap[tour.currency] ?? ""}${Number(tour.price_numeric).toLocaleString()}`
        : "Confirm price with partner";

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
                        {listedPrice}
                    </p>

                    {affiliate ? (
                        <a
                            href={affiliate}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-block mt-6 gth-btn-gold text-black px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition"
                        >
                            Check with booking partner →
                        </a>
                    ) : (
                        <p className="mt-6 text-sm text-gray-300">Partner booking link is not available for this tour.</p>
                    )}

                    <p className="text-sm text-gray-400 mt-3">
                        Prices, availability and booking conditions must be confirmed with the partner.
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
                            Explore {tour.title}. Confirm itinerary, inclusions and tour conditions with the provider before booking.
                        </p>
                    </div>

                    {/* 🔥 HIGHLIGHTS */}
                    <div className="mt-6 bg-naviblue p-6 rounded-xl border border-white/5">
                        <h2 className="text-xl font-bold mb-3">Highlights</h2>

                        <ul className="space-y-2 text-gray-300">
                            <li>Check itinerary and meeting point with the provider</li>
                            <li>Confirm cancellation and refund terms</li>
                            <li>Verify any taxes, extras and availability</li>
                        </ul>
                    </div>

                </div>

                {/* 🔥 RIGHT SIDEBAR (CONVERSION BOX) */}
                <div className="space-y-6">

                    <div className="bg-naviblue p-6 rounded-xl border border-white/5 sticky top-6">

                        <p className="text-2xl font-black text-yellow-500">
                            {listedPrice}
                        </p>

                        {affiliate ? (
                            <a
                                href={affiliate}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="block mt-6 gth-btn-gold hover:bg-yellow-400 text-black py-4 text-center rounded-xl font-black text-lg transition-all"
                            >
                                Continue to booking partner →
                            </a>
                        ) : (
                            <p className="mt-6 text-sm text-gray-300">Online partner booking unavailable.</p>
                        )}

                        <p className="text-xs text-gray-400 mt-3">
                            Booking, payment and confirmation take place on the partner website.
                        </p>

                    </div>

                </div>

            </div>


            <RelatedCarousel related={related} symbolMap={symbolMap} />



        </div>

    )
}