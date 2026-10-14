import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";
import { hotelPageWindow } from "@/lib/travel/hotel-page-window";

const PAGE_SIZE = 24;
const PARTNER_HOSTS = ["klook.com", "trip.com", "booking.com", "hotellook.com", "tp.media", "tpo.lv"];
const safeHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function safePartnerLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    return PARTNER_HOSTS.some((domain) => host === domain || host.endsWith("." + domain)) ? url.toString() : null;
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
  const rawCity = searchParams.get("city");
  const rawName = searchParams.get("name");
  const city = rawCity ? cleanString(rawCity, {
    min: 2, max: 80, pattern: /^[\p{L}\p{M}\s.'-]+$/u,
  }) : null;
  const name = rawName ? cleanString(rawName, {
    min: 2, max: 80, pattern: /^[\p{L}\p{M}\p{N}\s.'&-]+$/u,
  }) : null;
  if ((!city && !name) || (rawCity && !city) || (rawName && !name))
    return NextResponse.json({ error: "Enter a valid hotel name or destination" }, { status: 400, headers: safeHeaders });
  const rawPage = searchParams.get("page") ?? "1";
  if (!/^[1-9][0-9]{0,2}$/.test(rawPage) || Number(rawPage) > 100) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400, headers: safeHeaders });
  }
  const page = Number(rawPage);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 503, headers: safeHeaders });
  }
  try {
    const supabase = createClient(url, key);
    // Name queries search globally (with optional city) instead of pretending
    // that a hotel brand is a city. Escaped percent/underscore are literals.
    const safeLike = (value: string) => "%" + value.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    const cityLike = city ? safeLike(city) : "";
    const nameLike = name ? safeLike(name) : "";
    let supplierCountQuery = supabase.from("hotels").select("id", { count: "exact", head: true }).eq("is_public", true);
    let catalogCountQuery = supabase.from("hotel_catalog").select("source_id", { count: "exact", head: true });
    if (city) { supplierCountQuery = supplierCountQuery.ilike("city", cityLike); catalogCountQuery = catalogCountQuery.ilike("city", cityLike); }
    if (name) { supplierCountQuery = supplierCountQuery.ilike("name", nameLike); catalogCountQuery = catalogCountQuery.ilike("name", nameLike); }
    const [supplierCountResult, catalogCountResult] = await Promise.all([supplierCountQuery, catalogCountQuery]);
    const supplierCount = supplierCountResult.error ? 0 : (supplierCountResult.count ?? 0);
    const catalogCount = catalogCountResult.error ? 0 : (catalogCountResult.count ?? 0);
    if (supplierCountResult.error && catalogCountResult.error) {
      return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
    }
    const firstWindow = hotelPageWindow(page, supplierCount, catalogCount, PAGE_SIZE);
    let supplierFailed = Boolean(supplierCountResult.error);
    let supplierRows: Array<{ id: string | number; name: string; city: string; image_url: string | null; affiliate_link: string | null }> = [];
    if (firstWindow.supplierTake > 0) {
      let supplierQuery = supabase.from("hotels")
        .select("id,name,city,image_url,affiliate_link,is_public")
        .eq("is_public", true);
      if (city) supplierQuery = supplierQuery.ilike("city", cityLike);
      if (name) supplierQuery = supplierQuery.ilike("name", nameLike);
      const { data, error } = await supplierQuery.order("name").order("id")
        .range(firstWindow.supplierStart, firstWindow.supplierStart + firstWindow.supplierTake - 1);
      if (error) supplierFailed = true;
      else supplierRows = data ?? [];
    }
    // A failed supplier read must never shift the catalog offset beyond records
    // that have not yet been displayed: start again with catalog-only paging.
    const supplierVisible = supplierFailed ? 0 : supplierCount;
    const window = hotelPageWindow(page, supplierVisible, catalogCount, PAGE_SIZE);
    if (supplierFailed) supplierRows = [];
    let catalogFailed = Boolean(catalogCountResult.error);
    let catalogRows: Array<{ source_id: string; name: string; city: string | null; category: string }> = [];
    if (window.catalogTake > 0 && !catalogFailed && window.catalogStart < catalogCount) {
      let catalogQuery = supabase.from("hotel_catalog").select("source_id,name,city,category");
      if (city) catalogQuery = catalogQuery.ilike("city", cityLike);
      if (name) catalogQuery = catalogQuery.ilike("name", nameLike);
      const { data, error } = await catalogQuery.order("name").order("source_id")
        .range(window.catalogStart, window.catalogStart + window.catalogTake - 1);
      if (error) catalogFailed = true;
      else catalogRows = data ?? [];
    }
    if (supplierFailed && catalogFailed) {
      return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
    }
    const listings = supplierRows
      .filter((hotel) => typeof hotel.name === "string" && hotel.name.trim() && typeof hotel.city === "string")
      .map((hotel) => ({
        id: hotel.id, name: hotel.name, city: hotel.city, stars: null,
        image: safeImage(hotel.image_url), affiliate_link: safePartnerLink(hotel.affiliate_link),
      }));
    const osm = catalogRows.filter((hotel) => typeof hotel.name === "string" && hotel.name.trim())
      .map((hotel) => ({
        id: "osm:" + hotel.source_id, name: hotel.name, city: hotel.city || city || "Location not specified",
        stars: null, image: "/placeholder.jpg", affiliate_link: null,
        source: "OpenStreetMap", source_license: "ODbL-1.0",
      }));
    // Name equality is not proof of duplicate physical properties; do not
    // discard unrelated hotels solely because they share a public name.
    const results = [...listings, ...osm];
    const visibleTotal = (supplierFailed ? 0 : supplierCount) + (catalogFailed ? 0 : catalogCount);
    return NextResponse.json(results, { headers: {
      ...safeHeaders, "X-GTH-Page": String(page), "X-GTH-Page-Size": String(PAGE_SIZE),
      "X-GTH-Has-More": String(results.length > 0 && page * PAGE_SIZE < visibleTotal),
    } });
  } catch {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
  }
}
