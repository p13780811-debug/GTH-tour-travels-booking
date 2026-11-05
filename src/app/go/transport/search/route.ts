import { NextRequest, NextResponse } from "next/server";

/**
 * Single-search partner handoff for bus, train and ferry.
 * Source routes were verified at 12go.asia/en/{bus|train|ferry}/{from}/{to}
 * on the supplier's public pages; date/people are best-effort supplier query
 * preferences and must be reconfirmed there.
 * User explicitly submits the form before this navigation; no cookie stuffing.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES = new Set(["bus", "train", "ferry"] as const);
const PROVIDER_ORIGIN = "https://12go.asia";
const AFFILIATE_ID = "17380992";

function single(params: URLSearchParams, key: string): string | null {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
}

function locationSlug(value: string | null): string | null {
  if (!value || value.length > 80) return null;
  const text = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  // No URL control characters, path separators, HTML or query delimiters.
  if (text.length < 2 || !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,()'-]{1,79}$/u.test(text)) return null;
  const slug = text.normalize("NFKD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en").replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return slug.length >= 2 && slug.length <= 120 ? encodeURIComponent(slug) : null;
}

function validDeparture(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + "T00:00:00Z");
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return false;
  const now = Date.now();
  return time >= now - 2 * 86400_000 && time <= now + 400 * 86400_000;
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = single(params, "mode");
  const sourcePath = MODES.has(mode as "bus" | "train" | "ferry") ? "/" + mode : "/travel";
  const from = locationSlug(single(params, "from"));
  const to = locationSlug(single(params, "to"));
  const date = single(params, "date");
  const people = single(params, "people");
  if (!mode || !MODES.has(mode as "bus" | "train" | "ferry") ||
      !from || !to || from === to || !validDeparture(date) || !people || !/^[1-8]$/.test(people)) {
    const fallback = new URL(sourcePath, request.url);
    fallback.searchParams.set("search", "invalid");
    return noStore(NextResponse.redirect(fallback, 303));
  }

  // Fixed, allowlisted host + mode and validated path slugs; no open redirects.
  const supplier = new URL("/en/" + mode + "/" + from + "/" + to, PROVIDER_ORIGIN);
  supplier.searchParams.set("date", date);
  supplier.searchParams.set("people", people);
  supplier.searchParams.set("z", AFFILIATE_ID);
  return noStore(NextResponse.redirect(supplier, 303));
}
