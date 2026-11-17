import { getCachedPublicTender } from "@/lib/tender/public-reader";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, requestError, RequestError } from "@/lib/security/request";
import { buildTenderDecisionPdf, type DecisionProfile } from "@/lib/intelligence/proposal-pdf";
import { TENDER_ID } from "@/lib/tender/discovery-workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Bounded public notice, user-consented, downloadable preparation draft.
 * Never scrapes company websites, collects tax/financial credentials or sends WhatsApp.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const expectedOrigin = new URL(req.url).origin;
    const actualOrigin = req.headers.get("origin");
    if (actualOrigin && actualOrigin !== expectedOrigin) throw new RequestError("Cross-origin request rejected", 403);
    if (req.headers.get("sec-fetch-site") === "cross-site") throw new RequestError("Cross-origin request rejected", 403);
    const id = (await params).id;
    if (!TENDER_ID.test(id)) throw new RequestError("Invalid tender reference", 400);
    const body = await readJson(req, 4000);
    if (body.consent !== true) throw new RequestError("Please confirm that the company details are yours to use", 400);
    const clean = (input: unknown, max: number, required = false): string => {
      if (typeof input !== "string") {
        if (required) throw new RequestError("Valid company name required", 400);
        return "";
      }
      const value = input.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim();
      if (value.length > max || (required && value.length < 2)) throw new RequestError("Invalid company profile field", 400);
      return value;
    };
    const name = clean(body.companyName, 100, true);
    const capability = clean(body.capability, 240);
    const preferredCity = clean(body.preferredCity, 80) || null;
    let companyWebsite: string | null = null;
    const website = clean(body.companyWebsite, 220);
    if (website) {
      try {
        const url = new URL(website);
        if (url.protocol !== "https:" || !url.hostname.includes(".") || url.port || url.username || url.password ||
          url.hostname.includes("localhost") || /^[\d.]+$/.test(url.hostname) || url.hostname.startsWith("["))
          throw new Error("Unsafe website");
        companyWebsite = url.origin + url.pathname.slice(0,100);
      } catch { throw new RequestError("Use a valid HTTPS company website or leave it blank", 400); }
    }
    await enforceRateLimit(req, "tender_operations");
    const result = await getCachedPublicTender(id);
    if (!result.ok) throw new RequestError(result.status === 400 ? "Invalid tender reference" : "Tender notice unavailable", result.status === 400 ? 400 : 503);
    if (!result.item) throw new RequestError("Published active tender not found", 404);
    const profile: DecisionProfile = {companyName:name,companyWebsite,capability,preferredCity};
    const pdf = buildTenderDecisionPdf(result.item, profile);
    const output = new Uint8Array(pdf.length);
    output.set(pdf);
    return new Response(output.buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="gth-decision-brief-' + id.toLowerCase() + '.pdf"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Length": String(output.byteLength),
      },
    });
  } catch (error) { return requestError(error); }
}