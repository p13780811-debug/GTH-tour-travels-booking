import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";

const PARTNER_HOSTS = ["klook.com", "trip.com", "booking.com", "hotellook.com", "tp.media", "tpo.lv"];

function safePartnerLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    return PARTNER_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function safeImage(value: unknown): string {
  if (typeof value !== "string") return "/placeholder.jpg";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = cleanString(searchParams.get("city"), {
    min: 2,
    max: 80,
    pattern: /^[\p{L}\p{M}\s.'-]+$/u,
  });

  if (!city) {
    return NextResponse.json({ error: "Enter a valid destination" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("hotels")
      .select("id,name,city,image_url,affiliate_link,is_public")
      .eq("is_public", true)
      .ilike("city", `%${city}%`)
      .limit(24);

    if (error) {
      return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    const listings = (data || [])
      .filter((hotel) => typeof hotel.name === "string" && hotel.name.trim() && typeof hotel.city === "string")
      .map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        stars: null,
        image: safeImage(hotel.image_url),
        affiliate_link: safePartnerLink(hotel.affiliate_link),
      }));

    // Catalog additions are source-attributed OSM places, not bookable room inventory.
    // Preserve all existing supplier-backed hotel listings before supplementing them.
    const { data: catalog, error: catalogError } = await supabase
      .from("hotel_catalog")
      .select("source_id,name,city,category")
      .ilike("city", `%${city}%`)
      .order("name")
      .limit(24);

    if (catalogError && listings.length === 0) {
      // A missing migration should not break the legacy hotel route.
      return NextResponse.json(listings, { headers: { "Cache-Control": "no-store" } });
    }

    const existingNames = new Set(listings.map((hotel) => hotel.name.trim().toLowerCase()));
    const osm = (catalog || [])
      .filter((hotel) => typeof hotel.name === "string" && hotel.name.trim() &&
        !existingNames.has(hotel.name.trim().toLowerCase()))
      .slice(0, Math.max(0, 24 - listings.length))
      .map((hotel) => ({
        id: `osm:${hotel.source_id}`,
        name: hotel.name,
        city: hotel.city || city,
        stars: null,
        image: "/placeholder.jpg",
        affiliate_link: null,
        source: "OpenStreetMap",
        source_license: "ODbL-1.0",
      }));

    return NextResponse.json([...listings, ...osm], { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
