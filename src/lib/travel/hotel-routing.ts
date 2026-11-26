import {
  HOTEL_BOOKING_ORIGIN,
  hotelWhiteLabelUrl,
  normalizeHotelOccupancies,
  type HotelBookingSearch,
  type HotelOccupancy,
} from "./hotel-whitelabel";

/**
 * One zero-API handoff for GTH hotel booking intent. A hotelId here must come
 * from a verified supplier record, never an OSM/database listing ID.
 * The White Label documents placeId (not arbitrary city text) for city results.
 */
const VERIFIED_CITY_IDS: Readonly<Record<string, string>> = {
  "mumbai": "ChIJwe1EZjDG5zsRaYxkjY_tpF0",
  "london": "ChIJdd4hrwug2EcRmSrV3Vo6llI",
  // Google officially publishes this Tokyo Place ID in its Place Photos example.
  // https://developers.google.com/maps/documentation/javascript/place-photos
  // Nuitee White Label accepts Google Place IDs; live results still need provider confirmation.
  "tokyo": "ChIJ51cu8IcbXWARiRtXIothAS4",
};
/** Known travel destinations awaiting exact Place ID verification.
 * Unknown locations also work via provider search; none of these entries
 * claim a verified ID or guaranteed available inventory.
 */
export const CITY_SEARCH_FALLBACKS = [
  "goa", "delhi", "new delhi", "jaipur", "bengaluru", "bangalore",
  "kolkata", "chennai", "hyderabad", "kochi", "cochin", "pune",
  "ahmedabad", "varanasi", "udaipur", "dubai", "abu dhabi",
  "singapore", "bangkok", "phuket", "bali", "denpasar",
  "paris", "new york", "kuala lumpur", "hong kong",
  "sydney", "melbourne", "rome", "barcelona", "amsterdam",
] as const;

const genericWords = /\b(?:hotels?|stays?|resorts?|accommodations?|lodgings?|rooms?|find|search|book|booking|best|cheap|top|in|near|at|around|for)\b/giu;
const days = 86_400_000;
const dateText = (value: Date) =>
  [String(value.getFullYear()).padStart(4, "0"), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
const nextLocalDate = (now: Date, offset: number) =>
  dateText(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
const dateNumber = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const date = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value ? date : NaN;
};
const positive = (value: unknown, max: number, fallback: number) => {
  const num = typeof value === "string" && /^\d{1,2}$/.test(value) ? Number(value) : value;
  return typeof num === "number" && Number.isInteger(num) && num >= 1 && num <= max ? num : fallback;
};
const safeId = (value: unknown, max = 100) =>
  typeof value === "string" && value.length <= max && /^[A-Za-z0-9_-]+$/.test(value) ? value : null;

export function cleanHotelDestination(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(genericWords, " ").replace(/[.,]+$/g, "")
    .replace(/\s+/g, " ").trim();
  // Keep user-controlled strings OUT of supplier paths. Non-Latin city names
  // are accepted as text but need a reviewed placeId to become a booking URL.
  if (cleaned.length < 2 || cleaned.length > 80 ||
      !/^[\p{L}\p{M}][\p{L}\p{M}\p{N}\s.'-]*$/u.test(cleaned)) return null;
  if (cleaned.toLocaleLowerCase("en") === "me") return null;
  return cleaned;
}

export function resolveHotelDates(checkIn: unknown, checkOut: unknown, now = new Date()) {
  const start = dateNumber(checkIn), end = dateNumber(checkOut);
  const today = dateNumber(dateText(now));
  if (Number.isFinite(start) && Number.isFinite(end) &&
      start >= today && start <= today + 730 * days &&
      end - start >= days && end - start <= 90 * days) {
    return {checkin: checkIn as string, checkout: checkOut as string, defaulted: false};
  }
  return {checkin: nextLocalDate(now, 1), checkout: nextLocalDate(now, 2), defaulted: true};
}

export type HotelRouteIntent = {
  hotelId?: string;
  destination?: string;
  placeId?: string;
  countryCode?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number | string;
  rooms?: number | string;
  occupancies?: HotelOccupancy[];
  currency?: string;
};
export type HotelRouteResolution =
  | {status: "ready"; kind: "hotel" | "city"; url: string; destination?: string; datesDefaulted: boolean}
  | {status: "unmapped"; kind: "city"; destination: string; url: string; datesDefaulted: boolean}
  | {status: "invalid"; kind: "hotel" | "city"};

/** A supplier-hosted destination picker for cities without an approved Place ID.
 * The official White Label listing route accepts no arbitrary city-name param.
 * Never add an unverified placeId or pretend this link is a city results page.
 */
export function hotelWhiteLabelSearchUrl(currency?: string, stay?: {
  checkin: string; checkout: string; occupancies: HotelOccupancy[];
}): string {
  // /hotels is the supplier results route and requires a verified placeId.
  // The root is the supplier-operated destination search (not empty results).
  const url = new URL("/", HOTEL_BOOKING_ORIGIN);
  url.searchParams.set("language", "en");
  url.searchParams.set("currency",
    ["INR","USD","EUR","GBP","AED","SGD","AUD","CAD","JPY"].includes(currency ?? "") ? currency! : "INR");
  if(stay) {
    url.searchParams.set("checkin",stay.checkin);
    url.searchParams.set("checkout",stay.checkout);
    url.searchParams.set("occupancies",btoa(JSON.stringify(stay.occupancies)));
    url.searchParams.set("adults",String(stay.occupancies.reduce((n,room)=>n+room.adults,0)));
    url.searchParams.set("rooms",String(stay.occupancies.length));
  }
  return url.toString();
}

/**
 * No fetch, SDK, autocomplete, geocoding, token or database call.
 * URLSearchParams and hotelWhiteLabelUrl encode every parameter exactly once.
 * An unmapped city deliberately stays unresolved instead of inventing a Place ID.
 */
export function resolveHotelRoute(intent: HotelRouteIntent, now = new Date()): HotelRouteResolution {
  const kind = intent.hotelId !== undefined ? "hotel" : "city";
  const hotelId = intent.hotelId === undefined ? null : /^(?:lp)[0-9a-f]{5,32}$/.test(intent.hotelId) ? intent.hotelId : null;
  if (kind === "hotel" && !hotelId) return {status: "invalid", kind};
  const destination = cleanHotelDestination(intent.destination);
  if (intent.placeId !== undefined && !safeId(intent.placeId, 255)) return {status:"invalid",kind};
  // Only supplier-reviewed city IDs are accepted for GTH-created deep links.
  // Unknown arbitrary IDs must use the supplier picker rather than guessed inventory.
  const cityKey = destination?.toLocaleLowerCase("en");
  const expectedCountry = cityKey === "mumbai" ? "IN" : cityKey === "london" ? "GB" : cityKey === "tokyo" ? "JP" : undefined;
  const scopedCityId = cityKey && (intent.countryCode === undefined || intent.countryCode === expectedCountry)
    ? VERIFIED_CITY_IDS[cityKey] ?? null : null;
  const placeId = intent.placeId !== undefined
    ? Object.values(VERIFIED_CITY_IDS).includes(intent.placeId) ? intent.placeId : null
    : scopedCityId;
  if (intent.placeId !== undefined && !placeId) return {status:"invalid",kind};
  if (kind === "city" && !placeId && !destination) return {status: "invalid", kind};
  const dates = resolveHotelDates(intent.checkIn, intent.checkOut, now);
  // Never silently replace a supplied invalid/expired date with tomorrow.
  // Defaults apply only when the traveller has not selected dates at all.
  if((intent.checkIn!==undefined || intent.checkOut!==undefined) && dates.defaulted)
    return {status:"invalid",kind};
  // Likewise an invalid supplied room/guest value is not a booking for two.
  if((intent.adults!==undefined && positive(intent.adults,20,0)===0) ||
     (intent.rooms!==undefined && positive(intent.rooms,8,0)===0))
    return {status:"invalid",kind};
  const adults = positive(intent.adults, 20, 2);
  const rooms = positive(intent.rooms, 8, 1);
  // The compact GTH form takes TOTAL adults across all rooms.
  // The supplier requires one occupancy with >=1 adult for every room.
  const occupancy = intent.occupancies ? normalizeHotelOccupancies(intent.occupancies) : null;
  if (intent.occupancies && !occupancy) return {status:"invalid",kind};
  if (!occupancy && adults < rooms) return {status:"invalid",kind};
  const occupancies: HotelOccupancy[] = occupancy ??
    Array.from({length: rooms}, (_, index) => ({
      adults: Math.floor(adults / rooms) + (index < adults % rooms ? 1 : 0),
      children: [],
    }));
  const currency = ["INR","USD","EUR","GBP","AED","SGD","AUD","CAD","JPY"].includes(intent.currency ?? "")
    ? intent.currency! : "INR";
  if(kind==="city" && !placeId) {
    return {status:"unmapped",kind,destination:destination!,
      url:hotelWhiteLabelSearchUrl(currency,{checkin:dates.checkin,checkout:dates.checkout,occupancies}),
      datesDefaulted:dates.defaulted};
  }
  const search: HotelBookingSearch = {
    ...(hotelId ? {hotelId} : {placeId: placeId!}),
    checkin: dates.checkin, checkout: dates.checkout, occupancies, currency,
  };
  const url = new URL(hotelWhiteLabelUrl(search));
  // The documented source of truth for guests is encoded occupancies.
  // These plain fields are appended for compatibility with White Label search controls.
  url.searchParams.set("adults", String(occupancies.reduce((sum, room) => sum + room.adults, 0)));
  url.searchParams.set("rooms", String(occupancies.length));
  return {status: "ready", kind, url: url.toString(),
    ...(destination ? {destination} : {}), datesDefaulted: dates.defaulted};
}

/** Backward-compatible zero-API handoff. Unknown cities open the provider's
 * own destination search interface; no on-site OSM search is forced.
 */
export function unverifiedHotelDestinationHref(destination: string, currency?: string): string {
  const result=resolveHotelRoute({destination,currency});
  return result.status==="invalid" ? hotelWhiteLabelSearchUrl(currency) : result.url;
}
