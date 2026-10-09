import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, requestError } from "@/lib/security/request";

export async function GET(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    if (user.app_metadata?.role !== "admin") throw new RequestError("Administrator access required", 403);
    const { data, error } = await client.from("leads")
      .select("id,property_id,phone,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new RequestError("Lead data unavailable", 503);
    return Response.json(data || [], { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
