import { NextResponse } from "next/server";
import { cleanDate, cleanIata } from "@/lib/security/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { RequestError, requestError } from "@/lib/security/request";
import { normalizeFares } from "@/lib/flights/fare-search";

export const runtime = "nodejs";

const unavailable = (status = 502) => NextResponse.json(
  { error: "Flight fare data is currently unavailable. Please retry later." },
  { status, headers: { "Cache-Control": "no-store" } },
);

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const origin = cleanIata(params.get("origin"));
    const destination = cleanIata(params.get("destination"));
    const departDate = cleanDate(params.get("depart_date"));
    const returnRaw = params.get("return_date");
    const returnDate = returnRaw ? cleanDate(returnRaw) : null;

    if (!origin || !destination || origin === destination || !departDate ||
        (returnRaw !== null && !returnDate)) {
      return NextResponse.json({ error: "Choose valid airports and travel dates." },
        { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const today = new Date().toISOString().slice(0, 10);
    const maxDate = new Date(Date.now() + 330 * 86_400_000).toISOString().slice(0, 10);
    if (departDate < today || departDate > maxDate ||
        (returnDate !== null && (returnDate < departDate || returnDate > maxDate))) {
      return NextResponse.json({ error: "Choose future dates within the next 330 days; return must follow departure." },
        { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const token = process.env.AVIASALES_API_TOKEN ||
      process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN;
    if (!token) return unavailable(503);

    await enforceRateLimit(req, "flights");

    const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("departure_at", departDate);
    if (returnDate) url.searchParams.set("return_at", returnDate);
    url.searchParams.set("one_way", returnDate ? "false" : "true");
    url.searchParams.set("currency", "inr");
    url.searchParams.set("sorting", "price");
    url.searchParams.set("unique", "false");
    url.searchParams.set("limit", "40");

    const response = await fetch(url, {
      headers: { "X-Access-Token": token, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 900 },
    });
    if (!response.ok) return unavailable();

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return unavailable();
    const record = payload as Record<string, unknown>;
    if (record.success !== true || (typeof record.currency === "string" &&
        record.currency.toLowerCase() !== "inr")) return unavailable();

    const results = normalizeFares(payload, { origin, destination, departDate, returnDate });
    return NextResponse.json({
      source: "Aviasales Data API",
      dataType: "cached_observations",
      currency: "INR",
      results,
      checkedAt: new Date().toISOString(),
      notice: "Previously observed fares are not live prices or guaranteed availability. Verify total price, baggage and conditions on the booking partner's site.",
    }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    return unavailable();
  }
}
