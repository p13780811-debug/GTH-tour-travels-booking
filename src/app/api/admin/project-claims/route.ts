import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function admin(req: Request) {
  const context = await authenticatedStorage(req);
  if (context.user.app_metadata?.role !== "admin") throw new RequestError("Administrator access required", 403);
  return context.client;
}
export async function GET(req: Request) {
  try {
    const client = await admin(req);
    const [claims, media] = await Promise.all([
      client.from("property_project_claims").select("id,claimant_id,project_id,rera_reference,claimant_role,legal_name,organization_name,authority_reference,created_at,status")
        .eq("status", "pending").order("created_at", { ascending: true }).limit(50),
      client.from("property_claim_media").select("id,claim_id,project_id,uploader_id,object_key,media_type,supplier,original_url,attribution,license_basis,permission_reference,created_at,status")
        .eq("status", "pending").order("created_at", { ascending: true }).limit(50),
    ]);
    if (claims.error || media.error) throw new RequestError("Review queue unavailable", 503);
    return Response.json({ claims: claims.data || [], media: media.data || [] },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
export async function POST(req: Request) {
  try {
    const client = await admin(req);
    const body = await readJson(req, 2048);
    const id = cleanString(body.id, { min: 36, max: 36, pattern: UUID });
    const type = cleanString(body.type, { min: 5, max: 16 });
    const decision = cleanString(body.decision, { min: 8, max: 12 });
    const notes = body.notes ? cleanString(body.notes, { max: 1000 }) : "";
    if (!id || !notes && body.notes || !["claim", "media"].includes(type || "") ||
      !["approved", "rejected", "taken_down"].includes(decision || "") ||
      (type === "claim" && decision === "taken_down"))
      throw new RequestError("Invalid review request", 400);
    if ((decision === "approved" || decision === "taken_down") && (notes || "").trim().length < 20)
      throw new RequestError("Document the independent verification or takedown reason (20 characters minimum)", 400);
    const name = type === "claim" ? "review_property_project_claim" : "review_property_claim_media";
    const { error } = await client.rpc(name, { p_id: id, p_decision: decision, p_notes: notes });
    if (error) throw new RequestError("Independent review denied or record unavailable", 409);
    return Response.json({ success: true, status: decision }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return requestError(error); }
}
