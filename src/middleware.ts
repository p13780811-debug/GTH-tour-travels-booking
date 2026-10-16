import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
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
