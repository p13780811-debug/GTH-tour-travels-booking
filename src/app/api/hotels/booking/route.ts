import { NextResponse } from "next/server";
import {hotelWhiteLabelUrl,parseHotelBookingSearch} from "@/lib/travel/hotel-whitelabel";
import {resolveHotelRoute} from "@/lib/travel/hotel-routing";
export const dynamic = "force-dynamic";

/** Zero supplier API calls. Fixed-origin redirect; never forward arbitrary fields. */
export function GET(request: Request) {
  const params=new URL(request.url).searchParams;
  for (const key of ["hotelId","placeId","city","destination","q","checkin","checkout","adults","rooms","occupancies","currency"]) {
    if (params.getAll(key).length > 1) return new NextResponse("Ambiguous hotel booking parameters.",{status:400});
  }
  // Preserve original fully specified supplier SearchBar links and child ages.
  const existing=parseHotelBookingSearch(params);
  if (existing) {
    const response=NextResponse.redirect(hotelWhiteLabelUrl(existing),307);
    response.headers.set("Cache-Control","no-store");
    return response;
  }
  const suppliedOccupancies=params.has("occupancies");
  // Invalid encoded occupancy is not silently replaced with a smaller party.
  if (suppliedOccupancies) return new NextResponse("Invalid or expired guest occupancy.",{status:400});
  const result=resolveHotelRoute({
    hotelId:params.get("hotelId")??undefined,
    placeId:params.get("placeId")??undefined,
    destination:params.get("city")??params.get("destination")??params.get("q")??undefined,
    checkIn:params.get("checkin")??undefined,checkOut:params.get("checkout")??undefined,
    adults:params.get("adults")??undefined,rooms:params.get("rooms")??undefined,
    currency:params.get("currency")??undefined,
  });
  if(result.status==="invalid")return new NextResponse(
    "Invalid hotel booking destination or supplier ID.",
    {status:400,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}}
  );
  const response=NextResponse.redirect(result.url,307);
  response.headers.set("Cache-Control","no-store");
  return response;
}
