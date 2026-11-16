import "server-only";
import { createClient } from "@supabase/supabase-js";
import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { normalizeGlobalRegistryStub, GlobalRegistryValidationError } from "@/lib/real-estate/global-registry";

export const runtime = "nodejs";

/** Owner-authenticated, Redis rate-limited, server-only creation. Never auto-verifies a registration. */
export async function POST(req: Request) {
  try {
    const { user } = await authenticatedStorage(req);
    await enforceRateLimit(req, "submissions", user.id);
    const body = await readJson(req, 2400);
    let project;
    try { project = normalizeGlobalRegistryStub(body); }
    catch (error) {
      if (error instanceof GlobalRegistryValidationError) throw new RequestError(error.message, 400);
      throw error;
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // NEVER exposed through NEXT_PUBLIC_*
    if (!url || !key) throw new RequestError("Registry onboarding unavailable", 503);
    const service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: existing, error: lookupError } = await service
      .from("global_registry_projects")
      .select("id,submitted_by")
      .eq("country_code", project.country_code)
      .eq("registry_authority", project.registry_authority)
      .eq("registration_id", project.registration_id)
      .maybeSingle()
      .abortSignal(AbortSignal.timeout(6000));
    if (lookupError) throw new RequestError("Registry onboarding unavailable", 503);
    if (existing) {
      if (existing.submitted_by !== user.id) {
        throw new RequestError("This reference was already submitted. Use the project-claim process.", 409);
      }
      return Response.json({ id: existing.id, status: "pending_global_review", created: false },
        { headers: { "Cache-Control": "private, no-store" } });
    }
    const { data, error } = await service
      .from("global_registry_projects")
      .insert({ ...project, submitted_by: user.id, verification_status: "pending_global_review" })
      .select("id")
      .single()
      .abortSignal(AbortSignal.timeout(6000));
    if (error) {
      if (error.code === "23505") throw new RequestError("This reference was already submitted. Please retry or claim it.", 409);
      throw new RequestError("Registry onboarding unavailable", 503);
    }
    if (!data?.id) throw new RequestError("Registry onboarding unavailable", 503);
    return Response.json({ id: data.id, status: "pending_global_review", created: true },
      { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
