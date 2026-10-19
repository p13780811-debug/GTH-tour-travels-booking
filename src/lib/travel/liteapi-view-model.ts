/**
 * Source-only LiteAPI display mapper. No persistent inventory/database writes.
 * Every field comes from the authenticated provider response; never guess stars,
 * availability, categories, facilities, prices or hotel photos.
 */
export type LiveHotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string | null;
  category: string | null;
  description: string | null;
  stars: number | null;
  amenities: string[];
  image: string | null;
  gallery: string[];
  photoProof?: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function str(value: unknown, length = 240): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= length ? normalized : null;
}
export function safeLiteApiImage(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password ||
        url.port || url.hash || !url.hostname.includes(".")) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
        host.endsWith(".localhost") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
        host.startsWith("[")) return null;
    return url.href;
  } catch { return null; }
}
export function providerHotelRows(raw: unknown): unknown[] {
  const payload = record(raw);
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  const data = record(payload.data);
  if (data && Array.isArray(data.hotels)) return data.hotels;
  if (Array.isArray(payload.hotels)) return payload.hotels;
  return [];
}
export function providerHotelDetail(raw: unknown): unknown {
  const value = record(raw);
  return value?.data ?? null;
}
export function normalizeLiteApiHotel(raw: unknown): LiveHotel | null {
  const hotel = record(raw);
  if (!hotel) return null;
  const id = str(hotel.id ?? hotel.hotelId, 128);
  const name = str(hotel.name ?? hotel.hotelName);
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id) || !name) return null;
  const stars = typeof hotel.starRating === "number" && Number.isFinite(hotel.starRating)
    && hotel.starRating >= 1 && hotel.starRating <= 5 ? hotel.starRating : null;
  const photoRows = Array.isArray(hotel.hotelImages) ? hotel.hotelImages : [];
  const images: string[] = [];
  const defaultImages: string[] = [];
  for (const item of photoRows.slice(0, 30)) {
    const photo = record(item);
    if (!photo) continue;
    const url = safeLiteApiImage(photo.url ?? photo.urlHd);
    if (url && !images.includes(url)) images.push(url);
    if (url && photo.defaultImage === true) defaultImages.push(url);
  }
  const main = safeLiteApiImage(hotel.main_photo) ??
    defaultImages[0] ?? safeLiteApiImage(hotel.thumbnail) ?? images[0] ?? null;
  const gallery = [...new Set([...(main ? [main] : []), ...images])].slice(0, 12);
  const facilities = Array.isArray(hotel.hotelFacilities) ? hotel.hotelFacilities : [];
  const amenities: string[] = [];
  for (const item of facilities.slice(0, 80)) {
    const value = typeof item === "string" ? item : str(record(item)?.name, 80);
    const clean = str(value, 80);
    if (clean && !amenities.includes(clean)) amenities.push(clean);
  }
  const type = str(hotel.hotelType ?? hotel.type, 80);
  const address = str(hotel.address, 400);
  return {
    id, name,
    city: str(hotel.city, 100) ?? "",
    country: (str(hotel.country, 2) ?? "").toUpperCase(),
    address, category: type,
    description: str(hotel.hotelDescription ?? hotel.description, 5000),
    stars, amenities, image: main, gallery,
  };
}
export function normalizeLiteApiList(raw: unknown): LiveHotel[] {
  const byId = new Map<string, LiveHotel>();
  for (const row of providerHotelRows(raw)) {
    const mapped = normalizeLiteApiHotel(row);
    if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
  }
  return [...byId.values()];
}
