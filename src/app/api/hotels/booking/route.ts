import { NextResponse } from "next/server";
import { hotelWhiteLabelUrl, parseHotelBookingSearch } from "@/lib/travel/hotel-whitelabel";
export const dynamic = "force-dynamic";
/** Fixed-origin handoff. No supplier API key, reservation writes or open redirects. */
export function GET(request: Request) {
  const search = parseHotelBookingSearch(new URL(request.url).searchParams);
  if (!search) return new NextResponse("Invalid or expired stay details. Return to GTH Hotels and search again.", {
    status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
  const response = NextResponse.redirect(hotelWhiteLabelUrl(search), 307);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
