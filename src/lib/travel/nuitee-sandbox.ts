import "server-only";

/** Nuitee sandbox-only supplier adapter. Never use production credentials here. */
const BASE = "https://api.liteapi.travel/v3.0/data";
type Hotel = Record<string, unknown>;
function key(): string {
  if (process.env.GTH_NUITEE_MODE !== "sandbox" ||
      process.env.GTH_NUITEE_SANDBOX_ENABLED !== "true") throw new Error("DISABLED");
  const value = process.env.NUITEE_SANDBOX_API_KEY?.trim();
  if (!value || !value.startsWith("sandbox_")) throw new Error("NOT_CONFIGURED");
  return value;
}
async function request(path: "hotels" | "hotel", params: URLSearchParams): Promise<unknown> {
  const apiKey = key();
  const response = await fetch(`${BASE}/${path}?${params}`, {
    headers: { "X-API-Key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("SUPPLIER_UNAVAILABLE");
  const data: unknown = await response.json();
  return data;
}
function object(v: unknown): Hotel | null {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? v as Hotel : null;
}
function str(v: unknown, max = 500): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0,max) : null;
}
function photo(v: unknown): string | null {
  const candidate = str(v,2048);
  if (!candidate) return null;
  try { const u = new URL(candidate); return u.protocol === "https:" && !u.username && !u.password ? u.toString() : null; }
  catch { return null; }
}
function photos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0,30).map(i => {
    const value = object(i);
    return photo(typeof i === "string" ? i : value?.url ?? value?.urlHd ?? value?.urlFull);
  }).filter((i): i is string => Boolean(i));
}
export function normalizeNuiteeHotel(value: unknown) {
  const h = object(value);
  if (!h) return null;
  const id = str(h.id,100);
  const name = str(h.name,200);
  if (!id || !name) return null;
  const city = str(h.city,120);
  const images = photos(h.hotelImages ?? h.images);
  const primary = photo(h.main_photo ?? h.mainPhoto ?? h.thumbnail) ?? images[0] ?? null;
  const address = str(h.address,500);
  return {
    supplier: "nuitee", supplierHotelId: id, name, city,
    countryCode: str(h.countryCode,3),
    address, images: primary ? [...new Set([primary,...images])] : images,
    stars: typeof h.starRating === "number" && h.starRating >= 0 && h.starRating <= 5 ? h.starRating : null,
    latitude: typeof h.latitude === "number" && Math.abs(h.latitude) <= 90 ? h.latitude : null,
    longitude: typeof h.longitude === "number" && Math.abs(h.longitude) <= 180 ? h.longitude : null,
    facilities: Array.isArray(h.hotelFacilities) ? h.hotelFacilities.slice(0,100) : [],
    description: str(h.hotelDescription,12000),
    sandbox: true, bookable: false,
  };
}
export async function listSandboxHotels(countryCode: string, cityName: string, limit: number, offset: number) {
  const params = new URLSearchParams({ countryCode, cityName, limit: String(limit), offset: String(offset) });
  const raw = object(await request("hotels",params));
  const rows = Array.isArray(raw?.data) ? raw.data : [];
  return { data: rows.map(normalizeNuiteeHotel).filter((h): h is NonNullable<typeof h> => h !== null),
    sandbox:true, bookingEnabled:false, count:rows.length };
}
export async function getSandboxHotel(hotelId: string) {
  const raw = object(await request("hotel",new URLSearchParams({hotelId})));
  return normalizeNuiteeHotel(raw?.data ?? raw);
}
