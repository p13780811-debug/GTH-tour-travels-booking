import { NextRequest, NextResponse } from "next/server";
import { findBookawayRoute } from "@/lib/travel/bookaway-routes";

/**
 * Optional Bookaway handoff, intentionally separate from the production 12Go
 * search route. Bookaway affiliate links are not live inventory/search APIs.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKAWAY_ORIGIN = "https://www.bookaway.com";
// Public referral identifiers visible in the approved affiliate dashboard.
// These are not API keys or secret credentials.
const BOOKAWAY_OFFER_ID = "34";
const BOOKAWAY_AFFILIATE_ID = "4344";

function single(params: URLSearchParams, key: string): string | null {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
}

function validDeparture(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    return false;
  }
  const now = Date.now();
  return time >= now - 2 * 86400_000 && time <= now + 400 * 86400_000;
}

function privateResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = single(params, "mode");
  const from = single(params, "from");
  const to = single(params, "to");
  const date = single(params, "date");
  const people = single(params, "people");

  if (!mode || !from || !to || !validDeparture(date) ||
      !people || !/^[1-8]$/.test(people)) {
    return privateResponse(NextResponse.json(
      { error: "Invalid journey details. Please use the GTH PRO journey form." },
      { status: 400 },
    ));
  }

  const route = findBookawayRoute(mode, from, to);
  if (!route) {
    return privateResponse(NextResponse.json(
      { error: "No independently verified alternate route is currently configured for this journey." },
      { status: 404 },
    ));
  }

  // Fixed official host and audited route paths only: never accept a URL/path
  // from query params. Official Bookaway guidance uses offer_id + aff_id.
  const target = new URL(route.path, BOOKAWAY_ORIGIN);
  if (target.origin !== BOOKAWAY_ORIGIN) {
    return privateResponse(NextResponse.json({ error: "Invalid route configuration." }, { status: 500 }));
  }
  target.searchParams.set("offer_id", BOOKAWAY_OFFER_ID);
  target.searchParams.set("aff_id", BOOKAWAY_AFFILIATE_ID);

  // Bookaway's published affiliate deeplink recipe strips original query
  // parameters. Date/passengers MUST be reconfirmed with the supplier.
  // This endpoint does not request or claim live seats, prices or schedules.
  return privateResponse(NextResponse.redirect(target, 303));
}
