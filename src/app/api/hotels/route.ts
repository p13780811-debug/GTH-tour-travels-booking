import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Supabase client (Backup ke liye rakha hai agar kabhi API fail ho jaye)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");

        if (!city) return NextResponse.json([]);

        // --- PRODUCTION LOGIC: ALWAYS FETCH LIVE DATA FIRST ---
        const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
        const MARKER = process.env.TRAVELPAYOUTS_MARKER;

        // Correct Yasen Endpoint for Cache Data
        const tpUrl = `https://engine.hotellook.com/api/v2/cache.json?location=${encodeURIComponent(city)}&currency=inr&token=${TOKEN}`;

        const tpRes = await fetch(tpUrl, {
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 3600 }
        });

        console.log("TP STATUS:", tpRes.status);

        // Agar Travelpayouts API fail hoti hai, tabhi Supabase par jao
        if (!tpRes.ok) {
            console.warn("⚠️ TP API failed, falling back to Supabase");
            const { data: dbData } = await supabase
                .from("hotels")
                .select("*")
                .ilike("city", `%${city}%`);
            return NextResponse.json(dbData || []);
        }

        const tpData = await tpRes.json();

        // Check if data is an array
        if (!Array.isArray(tpData)) {
            return NextResponse.json([]);
        }

        // --- FORMATTING FOR FRONTEND (ORIGINAL HD PHOTOS) ---
        const formattedHotels = tpData.map((h: any) => ({
            id: h.hotelId,
            name: h.hotelName,
            price: h.priceAvg || h.price_avg, // Handle different API key versions
            stars: h.stars,
            location: h.locationName || city,
            // Ye hai woh "Lal" HD Photo ka formula
            image: `https://photos.hotellook.com/hotels/720x400/${h.hotelId}.jpg`
        }));

        return NextResponse.json(formattedHotels);

    } catch (err) {
        console.error("🚨 Aggregator Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}