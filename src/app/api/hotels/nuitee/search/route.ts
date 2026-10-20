import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listSandboxHotels } from "@/lib/travel/nuitee-sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

/** Preview-only: requires a distinct internal test token, never the supplier key. */
export function sandboxAuthorized(request: Request): boolean {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.GTH_NUITEE_MODE !== "sandbox" ||
      process.env.GTH_NUITEE_SANDBOX_ENABLED !== "true") return false;
  const expected = process.env.GTH_NUITEE_TEST_ACCESS_TOKEN;
  const supplied = request.headers.get("x-gth-nuitee-test-token");
  if (!expected || expected.length < 32 || !supplied || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function GET(request: Request) {
  if (!sandboxAuthorized(request)) return error("Not found", 404);
  const params = new URL(request.url).searchParams;
  const city = params.get("city")?.trim() ?? "";
  const country = params.get("country")?.trim().toUpperCase() ?? "";
  const limitValue = params.get("limit") ?? "12";
  const offsetValue = params.get("offset") ?? "0";
  if (!/^[\p{L}\p{M} .'-]{2,80}$/u.test(city) ||
      !/^[A-Z]{2}$/.test(country) ||
      !/^(?:[1-9]|1[0-9]|2[0-4])$/.test(limitValue) ||
      !/^(0|[1-9][0-9]{0,3})$/.test(offsetValue))
    return error("Invalid city, country or pagination", 400);
  try {
    const payload = await listSandboxHotels(country, city, Number(limitValue), Number(offsetValue));
    return NextResponse.json(payload, { headers });
  } catch {
    return error("Sandbox supplier temporarily unavailable", 502);
  }
}
