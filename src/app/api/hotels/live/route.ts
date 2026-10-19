import { NextResponse } from "next/server";
import { searchLiteApiHotels, LiteApiError } from "@/lib/travel/liteapi-client";
import { normalizeLiteApiList, providerHotelRows } from "@/lib/travel/liteapi-view-model";
import { signLiteApiPhoto } from "@/lib/travel/liteapi-photo-proof";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const PAGE_SIZE = 20;

/** On-demand search only: never bulk-export LiteAPI data into Supabase or OSM. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = (params.get("country") ?? "").trim().toUpperCase();
  const city = (params.get("city") ?? "").trim();
  const pageText = params.get("page") ?? "1";
  const hotelName = (params.get("name") ?? "").trim();
  if (!/^[A-Z]{2}$/.test(country) ||
      !/^[\p{L}\p{M} .'-]{2,80}$/u.test(city) ||
      (hotelName && !/^[\p{L}\p{M}\p{N}\s.'&-]{2,80}$/u.test(hotelName)) ||
      !/^[1-9][0-9]{0,2}$/.test(pageText) || Number(pageText)>500)
    return NextResponse.json({ error: "Choose a valid city, ISO country and page (1–500)." }, { status: 400, headers });
  try {
    await enforceRateLimit(request, "hotels");
    const page = Number(pageText);
    const raw = await searchLiteApiHotels({ countryCode: country, cityName: city,
      hotelName: hotelName || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    const items = normalizeLiteApiList(raw).map(item =>
      ({ ...item, photoProof: item.image ? signLiteApiPhoto(item.id, item.image) ?? undefined : undefined }));
    return NextResponse.json({
      items, page, hasMore: providerHotelRows(raw).length === PAGE_SIZE && page < 500,
      imageCount: items.filter(item => Boolean(item.image)).length,
      starCount: items.filter(item => item.stars !== null).length,
      amenityCount: items.filter(item => item.amenities.length>0).length,
      source: "LiteAPI / Nuitée", availabilityChecked: false,
      message: "Hotel metadata only. Rates, booking availability and cancellation terms are not confirmed.",
    }, { headers });
  } catch (err) {
    // Safe error messages: no upstream body, headers or credentials leak to visitors.
    const status = err instanceof LiteApiError ? (err.status === 503 ? 503 : 502)
      : typeof err === "object" && err && "status" in err &&
        typeof err.status === "number" ? err.status : 502;
    return NextResponse.json({
      error: status === 429 ? "Too many searches; please try again later."
        : "Live hotel search is temporarily unavailable."
    }, { status: [429, 503].includes(status) ? status : 502, headers });
  }
}
