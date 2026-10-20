import { NextResponse } from "next/server";
import { getSandboxHotel } from "@/lib/travel/nuitee-sandbox";
import { sandboxAuthorized } from "@/lib/travel/nuitee-test-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!sandboxAuthorized(req)) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id))
    return NextResponse.json({ error: "Invalid hotel ID" }, { status: 400, headers });
  try {
    const hotel = await getSandboxHotel(id);
    if (!hotel) return NextResponse.json({ error: "Hotel unavailable" }, { status: 404, headers });
    return NextResponse.json({ data: hotel, sandbox: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Sandbox supplier unavailable" }, { status: 502, headers });
  }
}
