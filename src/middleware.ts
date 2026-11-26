import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hotelSupplierPathRedirect } from "@/lib/travel/hotel-whitelabel";
import { publicMumbaiMapResponse } from "@/lib/mobility/public-map-snapshot";
import { readPublicEdgeCache } from "@/lib/security/public-edge-cache";

export async function middleware(_request: NextRequest) {
  const pathname = _request.nextUrl.pathname;
  // Recover supplier hotel IDs before the local city-guide router treats them as slugs.
  const hotelDestination = pathname.startsWith("/hotels/") ? hotelSupplierPathRedirect(pathname, _request.nextUrl.searchParams) : null;
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

  // The dated public Mumbai extract needs no Next server, database or provider call.
  // All refreshes, expired snapshots, other cities and methods continue to the API.
  const response = pathname === "/api/mobility/map"
    ? publicMumbaiMapResponse(_request) ?? NextResponse.next()
    : (pathname.startsWith("/api/mobility/") || pathname === "/api/real-estate/registry-preview" || pathname === "/api/stadiums/concierge")
      ? await readPublicEdgeCache(_request) ?? NextResponse.next()
      : NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  const mobilityPath = /^\/mobility(?:\/[a-z0-9-]+)?$/.test(_request.nextUrl.pathname);
  const microphone = mobilityPath ? "(self)" : "()";
  response.headers.set(
    "Permissions-Policy",
    `camera=(), microphone=${microphone}, geolocation=(), payment=()`,
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
