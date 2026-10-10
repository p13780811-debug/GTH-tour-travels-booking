import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

async function getPexelsImage(query: string) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return "/placeholder.jpg";

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "3");
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return "/placeholder.jpg";

    const data = await res.json();
    return data?.photos?.[0]?.src?.large || "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Hotel service is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const city = cleanString(searchParams.get("city") || "travel", {
    min: 2,
    max: 80,
  });

  if (!city) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  const { data: hotels, error } = await supabase
    .from("hotels")
    .select("*")
    .ilike("city", `%${city}%`)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Hotel data unavailable" }, { status: 500 });
  }

  const cityImage = await getPexelsImage(`${city} hotel`);

  const formattedHotels = (hotels || []).map((hotel: Record<string, unknown>) => ({
    id: hotel.id,
    name: hotel.name,
    price: hotel.price,
    stars: hotel.stars,
    city: hotel.city,
    image: hotel.image_url || cityImage,
    affiliate_link: hotel.affiliate_link,
  }));

  return NextResponse.json(formattedHotels);
}
