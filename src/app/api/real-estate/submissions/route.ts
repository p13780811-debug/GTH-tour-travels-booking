import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanPositiveInteger, cleanString, cleanStringArray } from "@/lib/security/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const PROPERTY_TYPES = ["Apartment", "Villa", "Penthouse", "Commercial", "Plot"] as const;
const LISTING_TYPES = ["buy", "rent"] as const;
const SUBMITTER_ROLES = ["owner", "agent", "developer", "other"] as const;
const CURRENCIES = ["INR", "AED", "USD", "GBP", "EUR", "SGD"] as const;

function optionalInteger(value: unknown, options: { min: number; max: number }) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = cleanPositiveInteger(value, options);
  if (parsed === null) throw new RequestError("Invalid inventory details", 400);
  return parsed;
}

function optionalMoney(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(raw)) throw new RequestError("Invalid price", 400);
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) throw new RequestError("Invalid price", 400);
  return amount;
}

function optionalAreaSqft(body: Record<string, unknown>) {
  const legacy = optionalInteger(body.area_sqft, { min: 1, max: 1000000 });
  if (legacy !== null) return legacy;

  if (body.area_value === undefined || body.area_value === null || body.area_value === "") return null;
  const raw = String(body.area_value).trim();
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(raw)) throw new RequestError("Invalid property area", 400);

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new RequestError("Invalid property area", 400);

  const unit = String(body.area_unit || "sqft");
  const sqft = unit === "sqm" ? Math.round(value * 10.7639104167) : unit === "sqft" ? Math.round(value) : NaN;
  if (!Number.isFinite(sqft) || sqft < 1 || sqft > 1000000) throw new RequestError("Invalid property area", 400);
  return sqft;
}

function cleanMediaUrls(value: unknown, userId: string) {
  const projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.local").hostname;
  const prefix = `/storage/v1/object/public/property-images/properties/${userId}/`;
  if (value !== undefined && (!Array.isArray(value) || value.length > 8 || value.some(item => typeof item !== "string" || item.length > 800)))
    throw new RequestError("Invalid property photos", 400);
  return cleanStringArray(value, { maxItems: 8, maxLength: 800 }).map(raw => {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || url.hostname !== projectHost || url.username || url.password || url.port || url.search || url.hash || !url.pathname.startsWith(prefix) || !/^[0-9a-f-]{36}\.webp$/i.test(url.pathname.slice(prefix.length))) {
        throw new Error("invalid");
      }
      return url.toString();
    } catch {
      throw new RequestError("Invalid property media reference", 400);
    }
  });
}

export async function GET(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    const { data, error } = await client
      .from("listing_submissions")
      .select("id,title,status,property_id,target_project_id,registry_reference,price_amount,currency,bedrooms,bathrooms,area_sqft,submitter_role,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new RequestError("Submission history unavailable", 503);
    return Response.json(data || [], { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return requestError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { client, user } = await authenticatedStorage(req);
    await enforceRateLimit(req, "submissions", user.id);
    const body = await readJson(req, 14000);

    const base: Record<string, string> = {};
    // Plain-text submission fields only; reject markup and control characters.
    for (const key of ["title","country","city","location","description"])
      if (typeof body[key] === "string" && /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body[key] as string))
        throw new RequestError("Use plain text for property details", 400);
    for (const [key, min, max] of [
      ["title", 3, 180],
      ["country", 2, 80],
      ["city", 2, 80],
      ["location", 2, 250],
      ["description", 20, 5000],
    ] as const) {
      const value = cleanString(body[key], { min, max });
      if (!value) throw new RequestError("Invalid listing details", 400);
      base[key] = value;
    }

    if (!PROPERTY_TYPES.includes(String(body.property_type) as (typeof PROPERTY_TYPES)[number])) {
      throw new RequestError("Invalid listing type", 400);
    }
    if (!LISTING_TYPES.includes(String(body.listing_type) as (typeof LISTING_TYPES)[number])) {
      throw new RequestError("Invalid listing type", 400);
    }

    const submitterRole = String(body.submitter_role || "");
    if (!SUBMITTER_ROLES.includes(submitterRole as (typeof SUBMITTER_ROLES)[number])) {
      throw new RequestError("Select your relationship to the property", 400);
    }

    const currency = String(body.currency || "INR").toUpperCase();
    if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
      throw new RequestError("Unsupported listing currency", 400);
    }

    const registryReference = typeof body.registry_reference === "string"
      ? body.registry_reference.trim().toUpperCase()
      : "";

    if (registryReference && !/^P\d{11}$/.test(registryReference)) {
      throw new RequestError("Invalid MahaRERA registration number", 400);
    }

    let targetProjectId: number | null = null;
    if (registryReference) {
      const { data: projects, error: registryError } = await client
        .from("properties")
        .select("id,title,country,city,location,rera_id,source_type")
        .eq("rera_id", registryReference)
        .eq("source_type", "registry")
        .limit(1).abortSignal(AbortSignal.timeout(5000));

      if (registryError) throw new RequestError("Registry lookup unavailable", 503);
      const project = projects?.[0];
      if (!project) throw new RequestError("This MahaRERA project is not in the GTH PRO registry yet", 400);

      targetProjectId = Number(project.id);
      base.title = String(project.title || base.title);
      base.country = String(project.country || base.country);
      base.city = String(project.city || base.city);
      base.location = String(project.location || base.location);
    }

    const possession = body.possession_status || null;
    if (possession !== null && !["ready_to_move","under_construction","off_plan"].includes(String(possession))) throw new RequestError("Invalid possession status",400);
    const basis = body.area_basis || null;
    if (basis !== null && !["carpet","built_up","plot"].includes(String(basis))) throw new RequestError("Invalid area basis",400);
    const agentRegistration = body.agent_registration ? cleanString(body.agent_registration,{min:3,max:80,pattern:/^[A-Za-z0-9 /-]+$/}) : null;
    if (body.agent_registration && !agentRegistration) throw new RequestError("Invalid partner registration",400);
    if (submitterRole === "agent" && base.country.toLowerCase() === "india" && !/^A[0-9]{11}$/.test(agentRegistration || "")) throw new RequestError("Provide the channel partner's MahaRERA agent registration (A followed by 11 digits)",400);
    const photos = cleanMediaUrls(body.media_urls, user.id);
    if (photos.length && body.media_rights_confirmed !== true) throw new RequestError("Confirm permission to publish these property photographs",400);
    if (body.is_new_launch !== undefined && typeof body.is_new_launch !== "boolean") throw new RequestError("Invalid launch selection",400);
    if (body.is_new_launch === true && body.listing_type !== "buy") throw new RequestError("New launch inventory must be offered for sale",400);
    const payload = {
      ...base,
      property_type: String(body.property_type),
      listing_type: String(body.listing_type),
      submitter_role: submitterRole,
      target_project_id: targetProjectId,
      registry_reference: registryReference || null,
      price_amount: optionalMoney(body.price_amount),
      currency,
      bedrooms: optionalInteger(body.bedrooms, { min: 0, max: 20 }),
      bathrooms: optionalInteger(body.bathrooms, { min: 0, max: 20 }),
      area_sqft: optionalAreaSqft(body as Record<string, unknown>),
      media_urls: photos,
      possession_status: possession, area_basis: basis, agent_registration: agentRegistration,
      is_new_launch: body.is_new_launch === true, media_rights_confirmed: body.media_rights_confirmed === true,
    };

    const { error } = await client.from("listing_submissions").insert(payload).abortSignal(AbortSignal.timeout(8000));
    if (error) throw new RequestError("Submission service unavailable. No listing was published.", 503);

    return Response.json(
      { success: true, status: "review", linked_registry: Boolean(targetProjectId) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return requestError(error);
  }
}
