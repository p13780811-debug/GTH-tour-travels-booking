import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { authenticatedStorage } from "@/lib/security/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readBytes, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";

const BUCKET = "gth-re-claim-media";
const MAX_SOURCE = 8 * 1024 * 1024;
const MAX_OUTPUT = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const KINDS = new Set(["photo", "render", "floor_plan"]);
const LICENSES = new Set(["creator", "authorized_owner", "documented_license"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().startsWith("multipart/form-data;")) throw new RequestError("Multipart form required", 415);
    const bytes = await readBytes(req, MAX_SOURCE + 16384);
    const form = await new Response(Buffer.from(bytes), { headers: { "content-type": ct } }).formData();
    const file = form.get("file");
    const claimId = cleanString(form.get("claim_id"), { min: 36, max: 36, pattern: UUID });
    const mediaType = cleanString(form.get("media_type"), { max: 30 });
    const basis = cleanString(form.get("license_basis"), { max: 40 });
    const supplier = cleanString(form.get("supplier"), { min: 2, max: 160 });
    const permission = cleanString(form.get("permission_reference"), { min: 12, max: 500 });
    const attribution = form.get("attribution") ? cleanString(form.get("attribution"), { max: 250 }) : null;
    const sourceRaw = form.get("original_url");
    const originalUrl = sourceRaw ? cleanString(sourceRaw, { max: 800 }) : null;
    if (!claimId || !mediaType || !KINDS.has(mediaType) || !basis || !LICENSES.has(basis) ||
      !supplier || !permission || (form.get("attribution") && !attribution) ||
      (sourceRaw && !originalUrl) || form.get("rights_attested") !== "true" ||
      !(file instanceof File) || !TYPES.has(file.type) || file.size < 1 || file.size > MAX_SOURCE) {
      throw new RequestError("Valid original image, source and permission attestation required", 400);
    }
    if (originalUrl) {
      try {
        const url = new URL(originalUrl);
        if (url.protocol !== "https:" || url.username || url.password) throw new Error();
      } catch { throw new RequestError("Source reference must be an HTTPS URL", 400); }
    }
    const { data: claim, error: claimError } = await client.from("property_project_claims")
      .select("id,project_id,status").eq("id", claimId).eq("claimant_id", user.id).single();
    if (claimError || !claim || !["pending", "approved"].includes(claim.status))
      throw new RequestError("Upload requires your pending or approved project claim", 403);
    await enforceRateLimit(req, "upload", user.id);

    let converted: Buffer;
    try {
      const source = Buffer.from(await file.arrayBuffer());
      const meta = await sharp(source, { failOn: "warning", limitInputPixels: 30_000_000 }).metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format || "") || (meta.pages || 1) !== 1)
        throw new Error("Unsupported/animated content");
      converted = await sharp(source, { failOn: "warning", limitInputPixels: 30_000_000 })
        .rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 }).toBuffer();
    } catch { throw new RequestError("Image could not be safely decoded", 415); }
    if (!converted.length || converted.length > MAX_OUTPUT)
      throw new RequestError("Processed image must be 5 MB or smaller", 413);

    const digest = createHash("sha256").update(converted).digest("hex");
    const objectKey = `claims/${user.id}/${claimId}/${randomUUID()}.webp`;
    const { error: uploadError } = await client.storage.from(BUCKET).upload(objectKey, converted, {
      contentType: "image/webp", upsert: false,
    });
    if (uploadError) throw new RequestError("Private media storage unavailable", 503);

    const { data, error } = await client.from("property_claim_media").insert({
      claim_id: claimId, project_id: claim.project_id, object_key: objectKey, sha256: digest,
      media_type: mediaType, supplier, original_url: originalUrl, attribution,
      license_basis: basis, permission_reference: permission, rights_attested: true,
    }).select("id,status,created_at").single();
    // Without a privileged delete route an upload that fails metadata registration is
    // retained PRIVATELY, never published. A controlled cleanup is a later RE-08 operation.
    if (error || !data) throw new RequestError("Media not accepted for review; private orphan cleanup may be required", 409);
    return Response.json({ ...data, message: "Private image queued for review; not publicly accessible." },
      { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return requestError(error); }
}
