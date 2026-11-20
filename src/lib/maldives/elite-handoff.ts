import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { parseTravelQuery } from "@/lib/router/cityContext";
import { resolveHotelDates } from "@/lib/travel/hotel-routing";
import { hotelWhiteLabelUrl, normalizeHotelOccupancies } from "@/lib/travel/hotel-whitelabel";

const FIELDS = new Set(["checkin","checkout","adults","children","currency","destination"]);
const PLACE_ID = /^ChIJ[A-Za-z0-9_-]{12,80}$/;

/** No paid Places API, no geocoding and no database mutation. */
export const verifiedMaldivesPlaceId = cache(async (): Promise<string | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const db = createClient(url, key, {
      auth: { persistSession:false, autoRefreshToken:false },
    });
    const {data,error} = await db.from("destinations")
      .select("name,country,country_code,nuitee_place_id")
      .eq("slug","maldives").eq("is_active",true)
      .limit(1).abortSignal(AbortSignal.timeout(3500)).maybeSingle();
    if (error || !data || data.name !== "Maldives" ||
        (data.country && data.country !== "Maldives") ||
        (data.country_code && data.country_code !== "MV")) return null;
    return typeof data.nuitee_place_id === "string" &&
      PLACE_ID.test(data.nuitee_place_id) ? data.nuitee_place_id : null;
  } catch {
    return null;
  }
});

export type MaldivesStayResult =
  | {status:"invalid"}
  | {status:"supplier_listing" | "destination_picker";href:string};

/** Exact supplier route only for verified IDs. Never drop the requested island. */
export function maldivesStayHandoff(
  input:URLSearchParams, placeId:string|null, now=new Date(),
):MaldivesStayResult {
  for (const key of input.keys()) {
    if (!FIELDS.has(key) || input.getAll(key).length !== 1) return {status:"invalid"};
  }
  if (input.has("destination") && input.get("destination") !== "Maldives") return {status:"invalid"};
  const query=new URLSearchParams(input);
  query.delete("destination");
  const parsed=parseTravelQuery(query,now);
  if (!parsed.ok) return {status:"invalid"};
  const stay=parsed.value, dates=resolveHotelDates(stay.checkin,stay.checkout,now);
  if ((stay.checkin || stay.checkout) && dates.defaulted) return {status:"invalid"};
  const occupancies=normalizeHotelOccupancies([{
    adults:stay.adults,children:[...stay.children],
  }]);
  if (!occupancies) return {status:"invalid"};
  if (placeId && PLACE_ID.test(placeId)) {
    return {status:"supplier_listing",href:hotelWhiteLabelUrl({
      placeId,checkin:dates.checkin,checkout:dates.checkout,
      occupancies,currency:stay.currency,
    })};
  }
  // Nuitee WL /hotels cannot resolve arbitrary text. Preserve all validated
  // context on the existing first-party booking search instead of opening
  // generic supplier-root nearby results.
  const fallback = new URLSearchParams({
    view:"booking",city:"Maldives",country:"MV",
    checkin:dates.checkin,checkout:dates.checkout,
    adults:String(stay.adults),children:stay.children.join(","),
    currency:stay.currency,
  });
  return {status:"destination_picker",href:"/hotels?"+fallback.toString()};
}
