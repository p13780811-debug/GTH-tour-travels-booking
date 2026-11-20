import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Bounded, read-only matching to existing public.destinations; never imports data. */
export type WorldwideCityMatch = Readonly<{
  name: string;
  slug: string;
  country: string | null;
  countryCode: string | null;
}>;

const CITY_QUERY = /^[\p{L}\p{M}\p{N} .,'’‘()&\/–—-]{2,70}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function searchWorldwideCities(
  db: Pick<SupabaseClient, "from">, raw: unknown,
): Promise<readonly WorldwideCityMatch[]> {
  if (process.env.ENABLE_UNIFIED_CITY_ROUTER !== "true" ||
      typeof raw !== "string" || raw.length > 85 ||
      /[\u0000-\u001f\u007f<>]/u.test(raw)) return [];
  const search = raw.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (!CITY_QUERY.test(search)) return [];
  // PostgREST LIKE wildcard/meta characters from the user are never treated
  // as operators. The only '%' is the intentional bounded prefix match.
  const escaped = search.replace(/[%_\\]/g, "\\$&");
  try {
    const { data, error } = await db.from("destinations")
      .select("name,slug,country,country_code")
      .eq("is_active", true)
      .ilike("name", escaped + "%")
      .order("name", { ascending: true })
      .limit(40)
      .abortSignal(AbortSignal.timeout(3_500));
    if (error || !Array.isArray(data)) return [];
    return data.filter(row =>
      typeof row.name === "string" && CITY_QUERY.test(row.name) &&
      typeof row.slug === "string" && row.slug.length <= 140 && SLUG.test(row.slug) &&
      (row.country === null || (typeof row.country === "string" && row.country.length <= 160)) &&
      (row.country_code === null || (typeof row.country_code === "string" &&
        /^[A-Z]{2}$/.test(row.country_code)))
    ).map(row => ({
      name: row.name, slug: row.slug,
      country: row.country, countryCode: row.country_code,
    }));
  } catch {
    return [];
  }
}
