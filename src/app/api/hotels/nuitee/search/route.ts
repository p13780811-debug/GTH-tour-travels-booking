import { NextResponse } from "next/server";
import { sandboxAuthorized } from "@/lib/travel/nuitee-test-auth";
import { listSandboxHotels } from "@/lib/travel/nuitee-sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

/** Preview-only: requires a distinct internal test token, never the supplier key. */
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
