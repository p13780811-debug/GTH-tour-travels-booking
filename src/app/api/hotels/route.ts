import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {

    try {

        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");

        if (!city) return NextResponse.json([]);

        const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
        const MARKER = process.env.TRAVELPAYOUTS_MARKER;

        // STEP 1 — Get cityId
        const searchCity = await fetch(
            `https://engine.hotellook.com/api/v2/lookup.json?query=${city}&token=${TOKEN}`
        );

        const cityData = await searchCity.json();

        const cityId = cityData?.results?.locations?.[0]?.id;

        if (!cityId) {
            console.log("City not found in TP");
            return NextResponse.json([]);
        }

        // STEP 2 — Get hotels using cityId
        const hotelRes = await fetch(
            `https://engine.hotellook.com/api/v2/cache.json?locationId=${cityId}&currency=inr&token=${TOKEN}`,
            { next: { revalidate: 3600 } }
        );

        const hotelData = await hotelRes.json();

        if (!Array.isArray(hotelData)) {
            return NextResponse.json([]);
        }

        const hotels = hotelData.slice(0, 20).map((h: any) => ({

            id: h.hotelId,
            name: h.hotelName,
            price: h.priceAvg || 0,
            stars: h.stars || 0,

            image: `https://photos.hotellook.com/hotels/720x400/${h.hotelId}.jpg`,

            affiliate_link:
                `https://tp.media/r?marker=${MARKER}&hotel_id=${h.hotelId}`

        }))

        return NextResponse.json(hotels)

    } catch (err) {

        console.error(err)

        return NextResponse.json({ error: "server error" })

    }

}