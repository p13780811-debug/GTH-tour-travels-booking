import { hotelWhiteLabelUrl } from "./travel/hotel-whitelabel";

/**
 * Standalone, pure destination link builder. It does not alter the installed
 * SearchBar/widget, existing routing, or any browser component.
 *
 * A future server-side caller can explicitly pass:
 * process.env.NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL
 *
 * Country/city names are NEVER substituted for a verified Nuitee Place ID.
 */
export type NuiteeDestinationLinkInput = {
  nuitee_place_id: string | null;
  country_code: string;
  referenceDate: Date;
  hopegooAffiliateUrl?: string | null;
};

const EAST_ASIA = new Set([
  "CN", "HK", "MO", "TW", "JP", "KR", "KP", "MN",
]);

function safeAffiliateUrl(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !hostname.includes(".") ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      /^\d+(?:\.\d+){3}$/.test(hostname) ||
      hostname.includes("..")
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function utcDay(date: Date, offset: number): string {
  const value = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + offset,
  ));
  return value.toISOString().slice(0, 10);
}

export function buildNuiteeDestinationDeepLink(
  input: NuiteeDestinationLinkInput,
): string | null {
  const country = input.country_code?.toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country)) return null;

  // A valid, configured approved affiliate URL takes priority in East Asia.
  // Do not invent city-specific query parameters for HopeGoo.
  if (EAST_ASIA.has(country)) {
    const fallback = safeAffiliateUrl(input.hopegooAffiliateUrl);
    if (fallback) return fallback;
  }

  const placeId = input.nuitee_place_id;
  if (
    typeof placeId !== "string" ||
    !/^[A-Za-z0-9_-]{5,255}$/.test(placeId) ||
    !Number.isFinite(input.referenceDate?.getTime())
  ) return null;

  // Reuses the existing official GTH white-label URL contract without
  // modifying its implementation. An exact 1-night stay starts tomorrow UTC.
  return hotelWhiteLabelUrl({
    placeId,
    checkin: utcDay(input.referenceDate, 1),
    checkout: utcDay(input.referenceDate, 2),
    occupancies: [{ adults: 2, children: [] }],
    currency: "INR",
  });
}
