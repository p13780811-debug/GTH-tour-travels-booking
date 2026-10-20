import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    if (user.app_metadata?.role !== "admin") throw new RequestError("Administrator required", 403);
    const body = await readJson(req, 512);
    const id = cleanString(body.id, { min: 36, max: 36, pattern: UUID });
    if (!id) throw new RequestError("Invalid media reference", 400);
    const { data: media, error } = await client.from("property_claim_media")
      .select("object_key").eq("id", id).single();
    if (error || !media?.object_key) throw new RequestError("Media unavailable", 404);
    const { data, error: signError } = await client.storage.from("gth-re-claim-media")
      .createSignedUrl(media.object_key, 60);
    if (signError || !data?.signedUrl) throw new RequestError("Media preview unavailable", 503);
    return Response.json({ url: data.signedUrl, expires_in: 60 },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
