import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, requestError } from "@/lib/security/request";

export async function GET(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    if (user.app_metadata?.role !== "admin") throw new RequestError("Administrator access required", 403);
    const { data, error } = await client.from("leads")
      .select("id,property_id,inventory_id,phone,source,status,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new RequestError("Lead data unavailable", 503);
    const rows = data || [];
    const details = rows.length ? await client.from("property_leads")
      .select("legacy_lead_id,project_name,full_name,email,preferred_unit,budget_range,intent_type")
      .in("legacy_lead_id", rows.map(row => row.id)) : { data: [], error: null };
    if (details.error) throw new RequestError("Lead details unavailable", 503);
    const byId = new Map((details.data || []).map(row => [row.legacy_lead_id, row]));
    return Response.json(rows.map(row => ({ ...row, buyer: byId.get(row.id) || null })), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
