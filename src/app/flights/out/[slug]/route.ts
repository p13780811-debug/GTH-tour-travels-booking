import { NextResponse } from "next/server";
import { findFlightPartner } from "@/lib/flights/partners";

// Only whitelisted, publisher-supplied URLs or known first-party routes may be
// used for partner handoffs. No redirect target ever comes from visitor input.
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const provider = findFlightPartner(slug);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const target = new URL(provider.destination, request.url);
  if (provider.external) {
    if (target.protocol !== "https:" || target.username || target.password ||
        !["tpo.lv", "aviasales.tpo.lv", "airhelp.tpo.lv", "compensair.tpo.lv",
          "ektatraveling.tpo.lv", "yesim.tpo.lv", "gettransfer.tpo.lv",
          "radicalstorage.tpo.lv", "klook.tpo.lv", "wegotrip.tpo.lv",
          "gocity.tpo.lv", "kkday.tpo.lv"].includes(target.hostname)) {
      return NextResponse.json({ error: "Provider unavailable" }, { status: 503 });
    }
  } else if (target.origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid internal service" }, { status: 503 });
  }
  const response = NextResponse.redirect(target, { status: 302 });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}
