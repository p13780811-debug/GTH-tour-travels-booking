import { NextResponse } from "next/server";

/**
 * 12Go approved the GTH PRO White Label on 4 November 2026.
 * Partner SSL issuance is independent of Vercel and may still be pending.
 * The approved affiliate checkout remains available while TLS is not ready.
 *
 * Only these fixed trusted destinations are ever used. No inbound URL, path,
 * query parameter, credentials or arbitrary redirect targets are forwarded.
 */
const WHITE_LABEL_URL = "https://transport.gthproglobal.com/";
const APPROVED_AFFILIATE_URL = "https://12go.asia/?z=17380992";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function whiteLabelIsReady(): Promise<boolean> {
  try {
    const response = await fetch(WHITE_LABEL_URL, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
      headers: { Accept: "text/html" },
    });
    // 12Go can redirect from / to its own landing-language page.
    // A supplier-side 4xx/5xx, DNS error or unissued TLS cert stays on fallback.
    const ready = response.status >= 200 && response.status < 400;
    await response.body?.cancel();
    return ready;
  } catch {
    return false;
  }
}

/** One-click booking entry: auto-select approved White Label after valid HTTPS activates. */
export async function GET() {
  const target = (await whiteLabelIsReady()) ? WHITE_LABEL_URL : APPROVED_AFFILIATE_URL;
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
