/**
 * Read-only LiteAPI inventory probe. Run only in a trusted environment with
 * LITEAPI_API_KEY set; never print credentials or publish sandbox results.
 *
 * npx tsx scripts/probe-liteapi-hotels.ts
 */
import { searchLiteApiHotels } from "../src/lib/travel/liteapi-client";

const cities = [
  { cityName: "Dubai", countryCode: "AE" },
  { cityName: "Mumbai", countryCode: "IN" },
  { cityName: "Panaji", countryCode: "IN" },
] as const;

function rowsOf(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  const possible = [object.data, object.hotels, object.results];
  for (const value of possible) {
    if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if (Array.isArray(nested.hotels)) return nested.hotels.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
    }
  }
  return [];
}

for (const city of cities) {
  try {
    const response = await searchLiteApiHotels({ ...city, limit: 25, offset: 0 });
    const rows = rowsOf(response);
    const imageCount = rows.filter(hotel => Array.isArray(hotel.hotelImages) && hotel.hotelImages.length > 0 || Array.isArray(hotel.images) && hotel.images.length > 0).length;
    const namedCount = rows.filter(hotel => typeof hotel.name === "string" || typeof hotel.hotelName === "string").length;
    console.log(JSON.stringify({ city: city.cityName, country: city.countryCode, returned: rows.length, named: namedCount, imageFieldsPresent: imageCount, responseShape: response && typeof response === "object" ? Object.keys(response).slice(0,12) : [] }));
  } catch (error) {
    console.error(JSON.stringify({city:city.cityName,country:city.countryCode,status: error instanceof Error && "status" in error ? (error as {status:unknown}).status : "unknown",error:"Provider request failed; credentials and raw response are hidden"}));
    process.exitCode=1;
  }
}
