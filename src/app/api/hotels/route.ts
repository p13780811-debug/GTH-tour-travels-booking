import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {

    const { searchParams } = new URL(req.url)
    const city = searchParams.get("city")

    if (!city) return Response.json([])
    console.log("CITY:", city)
    // 1️⃣ Supabase check
    const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("city", city?.charAt(0).toUpperCase() + city?.slice(1))

    if (data && data.length > 0) {
        return Response.json(data)
    }

    // 2️⃣ Agar Supabase empty hai to Travelpayouts API
    try {

        const url = `https://engine.hotellook.com/api/v2/cache.json?location=${city}&currency=usd&limit=10&token=${process.env.TRAVELPAYOUTS_TOKEN}`

        const res = await fetch(url)

        const apiData = await res.json()

        return Response.json(apiData)

    } catch {

        return Response.json([])

    }

}