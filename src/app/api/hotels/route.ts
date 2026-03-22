import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🚀 PEXELS SE IMAGE LANe WALA FUNCTION (With Cache)
async function getPexelsImage(query: string) {
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${query}&per_page=3&page=${Math.floor(Math.random() * 5) + 1}`,
            {
                headers: { Authorization: process.env.NEXT_PUBLIC_PEXELS_API_KEY! },
                next: { revalidate: 3600 } // 🔥 1 ghante tak Pexels ko dobara hit nahi karega (Cache)
            }
        );
        const data = await res.json();
        return data.photos.src.large || "/placeholder.jpg";
    } catch (e) {
        return "/placeholder-hotel.jpg";
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city") || "travel";

        // 1. Supabase se hotels lao
        const { data: hotels, error } = await supabase
            .from('hotels')
            .select('*')
            .ilike('city', `%${city}%`)
            .limit(10); // Limit kam rakho taaki Pexels hit kam ho

        if (error) return NextResponse.json({ error: "DB Error" }, { status: 500 });

        // 2. Har city ke liye EK hi Pexels image fetch karo (API Hits bachane ke liye)
        const cityImage = await getPexelsImage(`${city} hotel`);

        const formattedHotels = hotels.map((h: any) => ({
            id: h.id,
            name: h.name,
            price: h.price,
            stars: h.stars,
            city: h.city,
            // 🚀 AGAR DB mein image nahi hai, toh Pexels wali city image dikhao
            image: h.image_url || cityImage,
            affiliate_link: h.affiliate_link
        }));

        return NextResponse.json(formattedHotels);

    } catch (err) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}