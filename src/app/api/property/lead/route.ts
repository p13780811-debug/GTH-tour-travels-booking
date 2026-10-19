import { enforceRateLimit } from "@/lib/security/rate-limit"
import { readJson, RequestError, requestError } from "@/lib/security/request"
import { validateBuyerLead, safePropertyDocument, type PropertyDocument } from "@/lib/real-estate/buyer-leads"
import { propertyLeadWriter } from "@/lib/real-estate/lead-server"
export const runtime = "nodejs"
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin")
    if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") throw new RequestError("Use the project enquiry form on this site.", 403)
    const body = await readJson(req, 4096)
    let input
    try { input = validateBuyerLead(body) } catch (error) { throw new RequestError(error instanceof Error ? error.message : "Invalid enquiry", 400) }
    await enforceRateLimit(req, "enquiries")
    const db = propertyLeadWriter()
    const { data, error } = await db.rpc("gth_capture_property_lead", {
      p_property_id: input.propertyId, p_full_name: input.fullName, p_phone: input.phone,
      p_email: input.email, p_preferred_unit: input.preferredUnit, p_budget_range: input.budgetRange,
      p_intent_type: input.intent, p_request_id: input.requestId,
    })
    if (error) throw new RequestError(error.code === "P0002" ? "This project is unavailable." : error.code === "22023" ? "Please review your enquiry and retry." : "Your enquiry could not be saved. Please retry.", error.code === "P0002" ? 404 : error.code === "22023" ? 400 : 503)
    if (!Array.isArray(data) || data.length !== 1) throw new RequestError("Your enquiry could not be confirmed. Please retry.", 503)
    let documents: PropertyDocument[] = []
    try {
      const result = await db.from("property_documents").select("title,kind,url")
        .eq("property_id", input.propertyId).eq("is_public", true).eq("rights_verified", true).limit(10)
      if (!result.error) documents = (result.data || []).flatMap(row => { const document = safePropertyDocument(row); return document ? [document] : [] })
    } catch { /* A saved enquiry stays successful if document delivery is unavailable. */ }
    return Response.json({ received: true, request_reference: input.requestId,
      documents,
    }, { status: data[0].created ? 201 : 200, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
  } catch (error) { return requestError(error instanceof RequestError ? error : new RequestError("Project enquiries are temporarily unavailable.", 503)) }
}
