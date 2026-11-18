import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { refreshStadiumPredictions } from "@/lib/stadium-predictions/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const received = request.headers.get("authorization") ?? "";
  const expected = "Bearer " + secret;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Server-owned daily refresh. Never callable by the browser. */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Scheduled refresh is not configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshStadiumPredictions();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stadium refresh unavailable" }, { status: 503 });
  }
}
