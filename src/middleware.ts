import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hotelSupplierPathRedirect } from "@/lib/travel/hotel-whitelabel";
import {resolveHotelRoute} from "@/lib/travel/hotel-routing";

export function middleware(_request: NextRequest) {
  // Recover supplier hotel IDs before the local city-guide router treats them as slugs.
  const params=_request.nextUrl.searchParams;
  const supplierHotel=_request.nextUrl.pathname.match(/^\/hotels\/(?:stay\/)?(lp[0-9a-f]{5,32})\/?$/);
  // Date-free supplier ID links must not lose their exact hotel identity.
  // Leave complete legacy encoded occupancy links to the original validator.
  const canDefault=supplierHotel && !params.has("occupancies") &&
    ["checkin","checkout","adults","rooms","currency"].every(key=>params.getAll(key).length<=1);
  const supplierResult=canDefault?resolveHotelRoute({
    hotelId:supplierHotel[1],checkIn:params.get("checkin")??undefined,
    checkOut:params.get("checkout")??undefined,
    adults:params.get("adults")??undefined,rooms:params.get("rooms")??undefined,
    currency:params.get("currency")??undefined,
  }):null;
  const hotelDestination = supplierResult?.status==="ready" ? supplierResult.url :
    hotelSupplierPathRedirect(_request.nextUrl.pathname, params);
  if (hotelDestination) {
    const response = NextResponse.redirect(new URL(hotelDestination, _request.url), 307);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  // Backward compatibility for existing Travelpayouts flight-result links.
  // Prior White Label configuration incorrectly sent ?flightSearch= to /,
  // where the flagship homepage cannot display ticket results. Redirect only
  // this valid, fixed-format flight token to the existing /flights route.
  // Never redirect ordinary homepage visits or arbitrary query parameters.
  const flightCode = _request.nextUrl.searchParams.get("flightSearch");
  if (_request.nextUrl.pathname === "/" && flightCode &&
      /^[A-Za-z0-9]{10,40}$/.test(flightCode)) {
    const results = _request.nextUrl.clone();
    results.pathname = "/flights";
    results.search = "";
    results.searchParams.set("flightSearch", flightCode);
    const response = NextResponse.redirect(results, 307);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
