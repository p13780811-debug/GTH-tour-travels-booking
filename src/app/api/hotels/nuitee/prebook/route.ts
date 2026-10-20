import { NextResponse } from "next/server";
import { sandboxAuthorized } from "@/lib/travel/nuitee-test-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const result = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

/** Test-only rate recheck; never creates a confirmed reservation or takes payment. */
export async function POST(req: Request) {
  if (!sandboxAuthorized(req)) return result({ error: "Not found" }, 404);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return result({ error: "JSON required" }, 415);
  let input: unknown;
  try {
    const body = await req.text();
    if (body.length > 2048) return result({ error: "Request too large" }, 413);
    input = JSON.parse(body);
  } catch { return result({ error: "Invalid JSON" }, 400); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return result({ error: "Invalid body" }, 400);
  const record = input as Record<string, unknown>;
  const offerId = typeof record.offerId === "string" && /^[\w.:-]{8,512}$/.test(record.offerId) ? record.offerId : null;
  if (!offerId) return result({ error: "Invalid offer ID" }, 400);
  const key = process.env.NUITEE_SANDBOX_API_KEY;
  if (!key || !/^sand_[A-Za-z0-9_-]{12,}$/.test(key)) return result({ error: "Sandbox not configured" }, 503);
  try {
    const response = await fetch("https://book.liteapi.travel/v3.0/rates/prebook", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { "X-API-Key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ offerId, usePaymentSdk: false }),
    });
    if (!response.ok) return result({ error: "Sandbox prebook unavailable" }, 502);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return result({ error: "Invalid supplier reply" }, 502);
    return result({ sandbox: true, bookingConfirmed: false, prebook: (payload as Record<string,unknown>).data ?? null });
  } catch { return result({ error: "Sandbox prebook unavailable" }, 502); }
}
