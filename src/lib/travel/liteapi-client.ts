import "server-only";

/**
 * Nuitee/LiteAPI hotel content transport. This module never runs in the browser.
 * Sandbox credentials must not be used to publish inventory as live/bookable.
 */
const BASE_URL = "https://api.liteapi.travel/v3.0";
const ALLOWED_PATHS = new Set(["/data/hotels", "/data/hotel"]);

export type LiteApiHotelSearch = {
  countryCode?: string;
  cityName?: string;
  limit?: number;
  offset?: number;
};

export class LiteApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "LiteApiError";
  }
}

async function request<T>(path: "/data/hotels" | "/data/hotel", params: URLSearchParams): Promise<T> {
  if (!ALLOWED_PATHS.has(path)) throw new LiteApiError(400, "Unsupported LiteAPI path");
  const apiKey = process.env.LITEAPI_API_KEY;
  if (!apiKey) throw new LiteApiError(503, "LiteAPI server credentials are not configured");
  const url = new URL(BASE_URL + path);
  params.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { "X-API-Key": apiKey, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    // Never log the upstream response body: it may contain sensitive information.
    throw new LiteApiError(response.status, "LiteAPI upstream request failed");
  }
  return response.json() as Promise<T>;
}

/** Returns raw provider JSON for validation before mapping into Supabase. */
export function searchLiteApiHotels(filters: LiteApiHotelSearch): Promise<unknown> {
  const countryCode = filters.countryCode?.trim().toUpperCase();
  const cityName = filters.cityName?.trim();
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) throw new LiteApiError(400, "Invalid country code");
  if (!cityName || !/^[\p{L}\p{M} .'-]{2,80}$/u.test(cityName)) throw new LiteApiError(400, "Invalid city");
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0 || offset > 100000)
    throw new LiteApiError(400, "Invalid pagination");
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (countryCode) params.set("countryCode", countryCode);
  if (cityName) params.set("cityName", cityName);
  return request("/data/hotels", params);
}

export function getLiteApiHotel(hotelId: string): Promise<unknown> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(hotelId)) throw new LiteApiError(400, "Invalid hotel ID");
  return request("/data/hotel", new URLSearchParams({ hotelId }));
}
