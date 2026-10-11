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

function cleanMediaUrls(value: unknown, userId: string) {
  const projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.local").hostname;
  const prefix = `/storage/v1/object/public/property-images/properties/${userId}/`;
  return cleanStringArray(value, { maxItems: 8, maxLength: 800 }).map(raw => {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || url.hostname !== projectHost || !url.pathname.startsWith(prefix) || !url.pathname.endsWith(".webp")) {
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
    const body = await readJson(req, 14000);

    const base: Record<string, string> = {};
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
        .limit(1);

      if (registryError) throw new RequestError("Registry lookup unavailable", 503);
      const project = projects?.[0];
      if (!project) throw new RequestError("This MahaRERA project is not in the GTH PRO registry yet", 400);

      targetProjectId = Number(project.id);
      base.title = String(project.title || base.title);
      base.country = String(project.country || base.country);
      base.city = String(project.city || base.city);
      base.location = String(project.location || base.location);
    }

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
      area_sqft: optionalInteger(body.area_sqft, { min: 1, max: 1000000 }),
      media_urls: cleanMediaUrls(body.media_urls, user.id),
    };

    await enforceRateLimit(req, "submissions", user.id);
    const { error } = await client.from("listing_submissions").insert(payload);
    if (error) throw new RequestError("Submission service unavailable. No listing was published.", 503);

    return Response.json(
      { success: true, status: "review", linked_registry: Boolean(targetProjectId) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return requestError(error);
  }
}
