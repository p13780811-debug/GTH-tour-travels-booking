import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanDate, cleanPositiveInteger, cleanSlug } from "../security/validators";

/**
 * Read-only, server-side identity lookup. Never derives a city from a label,
 * supplier URL or fuzzy match. "country_code" remains nullable for the original
 * curated records; an unknown code must never be guessed.
 */
export type CityContext = Readonly<{
  id: string;
  name: string;
  slug: string;
  country: string | null;
  country_code: string | null;
  verifiedNuiteePlaceId: string | null;
}>;

export type CityIdentityInput = Readonly<{
  id?: unknown;
  slug?: unknown;
  country_code?: unknown;
}>;

export type CityLookupResult =
  | { status: "found"; city: CityContext }
  | { status: "invalid" | "not_found" | "unavailable" };

export type TravelQuery = Readonly<{
  checkin: string | null;
  checkout: string | null;
  adults: number;
  children: readonly number[];
  currency: HotelCurrency;
}>;

export const HOTEL_CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY",
] as const;
export type HotelCurrency = (typeof HOTEL_CURRENCIES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACE_ID = /^[A-Za-z0-9_-]{5,255}$/;
const TEXT = /^[\p{L}\p{M}\p{N} .,'’‘()&/–—`-]+$/u;
const QUERY_FIELDS = new Set(["checkin", "checkout", "adults", "children", "currency"]);
const DAY = 86_400_000;

function safeText(raw: unknown, max: number): string | null {
  if (typeof raw !== "string" || /[\u0000-\u001f\u007f<>]/u.test(raw)) return null;
  const text = raw.normalize("NFKC").replace(/\s+/gu, " ").trim();
  return text.length > 0 && text.length <= max && TEXT.test(text) ? text : null;
}

export function parseTravelQuery(
  raw: URLSearchParams | Readonly<Record<string, unknown>>,
  now: Date = new Date(),
): { ok: true; value: TravelQuery } | { ok: false; error: "invalid_travel_query" } {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    return { ok: false, error: "invalid_travel_query" };
  }

  const values: Record<string, unknown> = {};
  if (raw instanceof URLSearchParams) {
    for (const key of raw.keys()) {
      if (!QUERY_FIELDS.has(key) || raw.getAll(key).length !== 1) {
        return { ok: false, error: "invalid_travel_query" };
      }
      values[key] = raw.get(key);
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (!QUERY_FIELDS.has(key)) return { ok: false, error: "invalid_travel_query" };
      values[key] = value;
    }
  } else {
    return { ok: false, error: "invalid_travel_query" };
  }

  const startRaw = values.checkin;
  const endRaw = values.checkout;
  if ((startRaw !== undefined && startRaw !== null && typeof startRaw !== "string") ||
      (endRaw !== undefined && endRaw !== null && typeof endRaw !== "string")) {
    return { ok: false, error: "invalid_travel_query" };
  }
  const checkin = startRaw ? cleanDate(startRaw) : null;
  const checkout = endRaw ? cleanDate(endRaw) : null;
  if (Boolean(startRaw) !== Boolean(endRaw) || Boolean(checkin) !== Boolean(checkout)) {
    return { ok: false, error: "invalid_travel_query" };
  }
  if (checkin && checkout) {
    const today = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
    const start = Date.parse(checkin + "T00:00:00Z");
    const end = Date.parse(checkout + "T00:00:00Z");
    if (start < today || start > today + 730 * DAY ||
        end - start < DAY || end - start > 90 * DAY) {
      return { ok: false, error: "invalid_travel_query" };
    }
  }

  const adults = values.adults === undefined
    ? 2 : cleanPositiveInteger(values.adults, { min: 1, max: 20 });
  if (adults === null) return { ok: false, error: "invalid_travel_query" };

  const rawChildren = values.children;
  let children: number[] = [];
  if (rawChildren !== undefined && rawChildren !== null && rawChildren !== "") {
    if (typeof rawChildren === "string") {
      if (!/^\d{1,2}(?:,\d{1,2}){0,7}$/.test(rawChildren)) {
        return { ok: false, error: "invalid_travel_query" };
      }
      children = rawChildren.split(",").map(Number);
    } else if (Array.isArray(rawChildren)) {
      children = [...rawChildren];
    } else {
      return { ok: false, error: "invalid_travel_query" };
    }
  }
  if (children.length > 8 || children.some(age =>
    typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 17
  ) || adults + children.length > 40) {
    return { ok: false, error: "invalid_travel_query" };
  }

  const rawCurrency = values.currency ?? "INR";
  if (typeof rawCurrency !== "string" || !/^[A-Za-z]{3}$/.test(rawCurrency)) {
    return { ok: false, error: "invalid_travel_query" };
  }
  const currency = rawCurrency.toUpperCase();
  if (!HOTEL_CURRENCIES.some(item => item === currency)) {
    return { ok: false, error: "invalid_travel_query" };
  }
  return {
    ok: true,
    value: { checkin, checkout, adults, children, currency: currency as HotelCurrency },
  };
}

export async function resolveCityContext(
  db: Pick<SupabaseClient, "from">,
  input: CityIdentityInput,
): Promise<CityLookupResult> {
  if (!input || typeof input !== "object") return { status: "invalid" };
  const hasId = input.id !== undefined;
  const hasSlug = input.slug !== undefined;
  if (hasId === hasSlug) return { status: "invalid" };
  const id = hasId && typeof input.id === "string" && UUID.test(input.id)
    ? input.id.toLowerCase() : null;
  const slug = hasSlug ? cleanSlug(input.slug) : null;
  if ((hasId && !id) || (hasSlug && (!slug || slug.length > 140))) {
    return { status: "invalid" };
  }
  const suppliedCountry = input.country_code;
  const code = suppliedCountry === undefined ? null :
    typeof suppliedCountry === "string" && /^[A-Za-z]{2}$/.test(suppliedCountry)
      ? suppliedCountry.toUpperCase() : null;
  if (suppliedCountry !== undefined && !code) return { status: "invalid" };

  try {
    let query = db.from("destinations")
      .select("id,name,slug,country,country_code,nuitee_place_id")
      .eq("is_active", true);
    query = id ? query.eq("id", id) : query.eq("slug", slug!);
    if (code) query = query.eq("country_code", code);
    const { data, error } = await query.limit(1)
      .abortSignal(AbortSignal.timeout(4_000)).maybeSingle();
    if (error) return { status: "unavailable" };
    if (!data) return { status: "not_found" };

    const cityId = typeof data.id === "string" && UUID.test(data.id)
      ? data.id.toLowerCase() : null;
    const citySlug = cleanSlug(data.slug);
    const cityName = safeText(data.name, 160);
    const country = data.country === null ? null : safeText(data.country, 160);
    const countryCode = data.country_code === null ? null :
      typeof data.country_code === "string" && /^[A-Z]{2}$/.test(data.country_code)
        ? data.country_code : null;
    if (!cityId || !citySlug || citySlug.length > 140 || !cityName ||
        (data.country !== null && !country) ||
        (data.country_code !== null && !countryCode) ||
        (code && countryCode !== code)) {
      return { status: "unavailable" };
    }
    const verifiedNuiteePlaceId =
      typeof data.nuitee_place_id === "string" && PLACE_ID.test(data.nuitee_place_id)
        ? data.nuitee_place_id : null;
    return {
      status: "found",
      city: {
        id: cityId,
        name: cityName,
        slug: citySlug,
        country,
        country_code: countryCode,
        verifiedNuiteePlaceId,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
