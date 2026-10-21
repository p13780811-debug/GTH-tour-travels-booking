/** Public Nuitee booking configuration. No private API or reservation calls.
 * https://docs.liteapi.travel/docs/deeplinking-to-whitelabel
 */
export const HOTEL_BOOKING_ORIGIN = "https://gthproglobal.nuitee.link";
export const HOTEL_WIDGET_SCRIPT = "https://components.liteapi.travel/v1.0/sdk.umd.js";
export type HotelOccupancy = { adults: number; children: number[]; rooms?: number };
export type HotelBookingSearch = {
  placeId?: string; hotelId?: string; checkin: string; checkout: string;
  occupancies: HotelOccupancy[]; currency: string;
};
const currencies = new Set(["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"]);
const day = 86400000;
function dateValue(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const parsed = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : NaN;
}
export function normalizeHotelOccupancies(value: unknown): HotelOccupancy[] | null {
  if (!Array.isArray(value) || !value.length || value.length > 8) return null;
  const result: HotelOccupancy[] = [];
  let roomCount = 0, guestCount = 0;
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    const adults = item.adults, children = item.children, rooms = item.rooms ?? 1;
    if (typeof adults !== "number" || !Number.isInteger(adults) || adults < 1 || adults > 20 ||
        typeof rooms !== "number" || !Number.isInteger(rooms) || rooms < 1 || rooms > 8 ||
        !Array.isArray(children) || children.length > 8 ||
        children.some(age => typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 17)) return null;
    roomCount += rooms;
    guestCount += (adults + children.length) * rooms;
    // Hosted White Label expects one occupancy entry per room. Its parser
    // ignores the SDK's optional `rooms` count inside a single entry.
    for (let room = 0; room < rooms; room++) result.push({ adults, children: [...children] });
  }
  return roomCount <= 8 && guestCount <= 40 ? result : null;
}
export function parseHotelBookingSearch(params: URLSearchParams, now = new Date()): HotelBookingSearch | null {
  // Reject ambiguous duplicates rather than letting different layers choose different values.
  for (const key of ["placeId", "hotelId", "checkin", "checkout", "occupancies", "currency"]) {
    if (params.getAll(key).length > 1) return null;
  }
  const placeId = params.get("placeId") || undefined, hotelId = params.get("hotelId") || undefined;
  if ((!placeId && !hotelId) || (placeId && !/^[A-Za-z0-9_-]{5,255}$/.test(placeId)) ||
      (hotelId && !/^[A-Za-z0-9_-]{1,100}$/.test(hotelId))) return null;
  const checkin = params.get("checkin") || "", checkout = params.get("checkout") || "";
  const start = dateValue(checkin), end = dateValue(checkout), today = dateValue(now.toISOString().slice(0, 10));
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < today || start > today + 730 * day ||
      end - start < day || end - start > 90 * day) return null;
  const encoded = params.get("occupancies") || "";
  if (encoded.length > 4096 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  let occupancies: HotelOccupancy[] | null;
  try { occupancies = normalizeHotelOccupancies(JSON.parse(atob(encoded))); } catch { return null; }
  const currency = params.get("currency") || "INR";
  if (!occupancies || !currencies.has(currency)) return null;
  // Unknown fields, guest PII, offer IDs and arbitrary redirects are not forwarded.
  return { placeId, hotelId, checkin, checkout, occupancies, currency };
}
export function hotelBookingParams(search: HotelBookingSearch): URLSearchParams {
  const params = new URLSearchParams({ checkin: search.checkin, checkout: search.checkout,
    occupancies: btoa(JSON.stringify(search.occupancies)), currency: search.currency });
  if (search.placeId) params.set("placeId", search.placeId);
  if (search.hotelId) params.set("hotelId", search.hotelId);
  return params;
}
export function hotelWhiteLabelUrl(search: HotelBookingSearch): string {
  const url = new URL(search.hotelId ? `/hotels/${encodeURIComponent(search.hotelId)}` : "/hotels", HOTEL_BOOKING_ORIGIN);
  const params = hotelBookingParams(search);
  params.delete("hotelId");
  params.set("language", "en");
  url.search = params.toString();
  return url.toString();
}
/** Official SearchBar callback: keep the supplier's room counts and child ages. */
export function hotelWidgetSearchParams(value: unknown): URLSearchParams | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const place = data.place as Record<string, unknown> | undefined;
  if (typeof place?.place_id !== "string" || typeof data.checkin !== "string" ||
      typeof data.checkout !== "string" || typeof data.occupancies !== "string") return null;
  const params = new URLSearchParams({ placeId: place.place_id, checkin: data.checkin,
    checkout: data.checkout, occupancies: data.occupancies, currency: "INR" });
  const search = parseHotelBookingSearch(params);
  return search ? hotelBookingParams(search) : null;
}
