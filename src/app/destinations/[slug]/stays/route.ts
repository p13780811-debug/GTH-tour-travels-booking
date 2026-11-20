import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveCityContext } from "@/lib/router/cityContext";
import { SUPPORTED_UI_LOCALES } from "@/lib/router/edgeGeoAutoDetect";
import { resolveDestinationStayHandoff } from "@/lib/destinations/destinationStayHandoff";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };
const FIELDS = new Set(["checkin", "checkout", "adults", "children", "currency", "lang"]);
const CANONICAL_SITE = "https://www.gthproglobal.com";

/**
 * Destination-only hotel handoff. Never guesses a Google Place ID or forwards
 * arbitrary query fields to the supplier. Does not affect /flights or /tours.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 140) {
    return new NextResponse("Invalid destination.", { status: 400 });
  }
  const raw = request.nextUrl.searchParams;
  if ([...raw.keys()].some(key => !FIELDS.has(key) || raw.getAll(key).length !== 1)) {
    return new NextResponse("Invalid hotel search preferences.", { status: 400 });
  }
  const languages = raw.getAll("lang");
  if (languages.length && !SUPPORTED_UI_LOCALES.some(item => item === languages[0])) {
    return new NextResponse("Invalid hotel search language.", { status: 400 });
  }
  const stay = new URLSearchParams(raw);
  stay.delete("lang");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return new NextResponse("Destination search is temporarily unavailable.", { status: 503 });
  }
  const db = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await resolveCityContext(db, { slug });
  if (result.status !== "found") {
    return new NextResponse("Destination could not be verified.", { status: 503 });
  }

  const handoff = resolveDestinationStayHandoff(result.city, stay);
  if (handoff.status === "invalid") {
    return new NextResponse("Check your dates, adults, child ages and currency.", { status: 400 });
  }
  const url = handoff.status === "direct"
    ? handoff.href : new URL(handoff.href, CANONICAL_SITE).toString();
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
