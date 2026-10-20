import { authenticatedStorage } from "@/lib/security/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";

const ROLES = new Set(["developer", "owner", "agent"]);

export async function GET(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    const { data, error } = await client.from("property_project_claims")
      .select("id,project_id,rera_reference,claimant_role,legal_name,organization_name,status,created_at,reviewed_at")
      .eq("claimant_id", user.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw new RequestError("Claim history unavailable", 503);
    return Response.json(data || [], { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}

export async function POST(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    const body = await readJson(req, 4096);
    const rera = cleanString(body.rera_reference, { min: 12, max: 12, pattern: /^P[0-9]{11}$/i })?.toUpperCase();
    const role = cleanString(body.claimant_role, { min: 3, max: 20 });
    const legalName = cleanString(body.legal_name, { min: 3, max: 150 });
    const organization = body.organization_name ? cleanString(body.organization_name, { min: 2, max: 160 }) : null;
    const authority = cleanString(body.authority_reference, { min: 12, max: 500 });
    if (!rera || !role || !ROLES.has(role) || !legalName || !authority ||
      (body.organization_name && !organization) ||
      body.authority_attested !== true || body.rights_attested !== true) {
      throw new RequestError("Exact project details and authorization attestations are required", 400);
    }

    const { data: projects, error: lookupError } = await client.from("properties")
      .select("id,rera_id").eq("rera_id", rera).eq("source_type", "registry").limit(2);
    if (lookupError) throw new RequestError("Registry lookup unavailable", 503);
    if (!projects || projects.length !== 1) throw new RequestError("Unique registered project match required", 422);

    await enforceRateLimit(req, "submissions", user.id);
    const { data, error } = await client.from("property_project_claims").insert({
      project_id: projects[0].id, rera_reference: rera, claimant_role: role,
      legal_name: legalName, organization_name: organization, authority_reference: authority,
      authority_attested: true, rights_attested: true,
    }).select("id,project_id,rera_reference,status").single();
    if (error || !data) throw new RequestError("Claim could not be recorded; check for an existing pending claim", 409);
    return Response.json({ ...data, message: "Pending independent administrator review. No ownership or photo publication is verified." },
      { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return requestError(error); }
}
