import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveCityContext, type CityContext, type HotelCurrency,
} from "./cityContext";

/**
 * Edge-compatible, read-only preference resolver. No paid IP service,
 * geocoding, geolocation persistence, middleware or new tables.
 * Headers are approximate, not authentication or proof of residence.
 */
export const SUPPORTED_UI_LOCALES = [
  "en", "hi", "zh", "ja", "ko", "th", "ms", "vi", "fr", "es",
] as const;
export type UiLocale = (typeof SUPPORTED_UI_LOCALES)[number];
export type GeoSource = "disabled" | "default" | "country" | "exact_city";

export type GeoPreference = Readonly<{
  source: GeoSource;
  countryCode: string | null;
  headerCity: string | null;
  city: CityContext | null;
  currency: HotelCurrency;
  locale: UiLocale;
}>;

const COUNTRY_CURRENCIES: Readonly<Record<string, HotelCurrency>> = {
  IN: "INR", GB: "GBP", AE: "AED", SG: "SGD", JP: "JPY",
  AU: "AUD", CA: "CAD", FR: "EUR", DE: "EUR", ES: "EUR",
  IT: "EUR", NL: "EUR", BE: "EUR", PT: "EUR", IE: "EUR",
  AT: "EUR", FI: "EUR", GR: "EUR",
};
export function preferredCurrencyForCountry(countryCode: string | null): HotelCurrency {
  return (countryCode && COUNTRY_CURRENCIES[countryCode]) || "USD";
}

const COUNTRY_LOCALES: Readonly<Record<string, UiLocale>> = {
  IN: "hi", CN: "zh", HK: "zh", MO: "zh", TW: "zh",
  JP: "ja", KR: "ko", TH: "th", MY: "ms", VN: "vi",
  FR: "fr", ES: "es",
};
const GEO_CITY = /^[\p{L}\p{M}\p{N} .,'’‘()&\/–—-]{2,100}$/u;

function headerCity(raw: string | null): string | null {
  if (!raw || raw.length > 300) return null;
  try {
    const decoded = decodeURIComponent(raw);
    // Reject encoded CR/LF and controls BEFORE whitespace normalization.
    if (/[\u0000-\u001f\u007f<>]/u.test(decoded)) return null;
    const normalized = decoded.normalize("NFKC").replace(/\s+/gu, " ").trim();
    return GEO_CITY.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
function localePreference(raw: string | null, country: string | null): UiLocale {
  if (raw && raw.length <= 256) {
    for (const part of raw.split(",").slice(0, 10)) {
      const tag = part.split(";")[0].trim().toLowerCase();
      const language = tag.split("-")[0];
      if (SUPPORTED_UI_LOCALES.some(item => item === language)) {
        return language as UiLocale;
      }
    }
  }
  return (country && COUNTRY_LOCALES[country]) || "en";
}

export function readVercelGeoPreference(headers: Headers): GeoPreference {
  const rawCountry = headers.get("x-vercel-ip-country");
  const countryCode = rawCountry && /^[A-Z]{2}$/.test(rawCountry)
    ? rawCountry : null;
  const city = headerCity(headers.get("x-vercel-ip-city"));
  return {
    source: countryCode ? "country" : "default",
    countryCode,
    headerCity: countryCode ? city : null,
    city: null,
    currency: preferredCurrencyForCountry(countryCode),
    locale: localePreference(headers.get("accept-language"), countryCode),
  };
}

/** Only an unambiguous exact city+country match can become a trusted UUID. */
export async function resolveVercelGeoCity(
  db: Pick<SupabaseClient, "from">, headers: Headers,
): Promise<GeoPreference> {
  if (process.env.ENABLE_UNIFIED_CITY_ROUTER !== "true") {
    return {
      source: "disabled", countryCode: null, headerCity: null,
      city: null, currency: "USD", locale: "en",
    };
  }
  const pref = readVercelGeoPreference(headers);
  if (!pref.countryCode || !pref.headerCity) return pref;
  try {
    const { data, error } = await db.from("destinations").select("id,name,country_code")
      .eq("is_active", true)
      .eq("name", pref.headerCity)
      .eq("country_code", pref.countryCode)
      .limit(2)
      .abortSignal(AbortSignal.timeout(2_000));
    if (error || !Array.isArray(data) || data.length !== 1 ||
      data[0]?.name !== pref.headerCity ||
      data[0]?.country_code !== pref.countryCode ||
      typeof data[0]?.id !== "string") return pref;

    // Re-enter the Step 1 resolver to obtain a server-proven CityContext.
    const resolved = await resolveCityContext(db, {
      id: data[0].id, country_code: pref.countryCode,
    });
    if (resolved.status !== "found" ||
      resolved.city.name !== pref.headerCity) return pref;
    return { ...pref, source: "exact_city", city: resolved.city };
  } catch {
    return pref;
  }
}
