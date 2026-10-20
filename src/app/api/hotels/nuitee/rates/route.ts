import { NextResponse } from "next/server";
import { sandboxAuthorized } from "@/lib/travel/nuitee-test-auth";
import { cleanDate, cleanPositiveInteger } from "@/lib/security/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers });
}

/** Read-only sandbox rate lookup. Does not reserve rooms or charge guests. */
export async function POST(req: Request) {
  if (!sandboxAuthorized(req)) return reply({ error: "Not found" }, 404);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return reply({ error: "JSON required" }, 415);
  let raw: unknown;
  try {
    const body = await req.text();
    if (body.length > 4096) return reply({ error: "Request too large" }, 413);
    raw = JSON.parse(body);
  } catch { return reply({ error: "Invalid JSON" }, 400); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return reply({ error: "Invalid request" }, 400);
  const input = raw as Record<string, unknown>;
  const hotelId = typeof input.hotelId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(input.hotelId)
    ? input.hotelId : null;
  const checkin = cleanDate(input.checkin);
  const checkout = cleanDate(input.checkout);
  const adults = cleanPositiveInteger(input.adults, { min: 1, max: 8 });
  const currency = typeof input.currency === "string" && /^[A-Z]{3}$/.test(input.currency)
    ? input.currency : null;
  const guestNationality = typeof input.guestNationality === "string" &&
    /^[A-Z]{2}$/.test(input.guestNationality) ? input.guestNationality : null;
  if (!hotelId || !checkin || !checkout || !adults || !currency || !guestNationality)
    return reply({ error: "Invalid hotel, dates, guests, currency or nationality" }, 400);
  const nights = Math.round((Date.parse(checkout + "T00:00:00Z") - Date.parse(checkin + "T00:00:00Z")) / 86400000);
  if (checkin < new Date().toISOString().slice(0, 10) || nights < 1 || nights > 30)
    return reply({ error: "Stay dates must be future dates, 1–30 nights" }, 400);
  const apiKey = process.env.NUITEE_SANDBOX_API_KEY;
  if (!apiKey?.startsWith("sand_")) return reply({ error: "Sandbox not configured" }, 503);
  try {
    const response = await fetch("https://api.liteapi.travel/v3.0/hotels/rates", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        hotelIds: [hotelId], checkin, checkout, occupancies: [{ adults }],
        currency, guestNationality, roomMapping: true, maxRatesPerHotel: 5,
        includeHotelData: false,
      }),
    });
    if (!response.ok) return reply({ error: "Supplier rates unavailable" }, 502);
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result))
      return reply({ error: "Invalid supplier response" }, 502);
    const data = result as Record<string, unknown>;
    // Return only the selected hotel's offer payload; never label sandbox pricing as live production pricing.
    return reply({ sandbox: true, bookable: false, hotelId,
      data: Array.isArray(data.data) ? data.data.filter(item =>
        Boolean(item && typeof item === "object" &&
          (item as Record<string, unknown>).hotelId === hotelId)).slice(0, 1) : [],
      disclaimer: "Sandbox test rates, not real bookable inventory" });
  } catch {
    return reply({ error: "Supplier rates unavailable" }, 502);
  }
}
