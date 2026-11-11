import "server-only";
import {unstable_cache} from "next/cache";
import {supabase} from "@/lib/supabase";
import {PUBLIC_PROPERTY_FIELDS, transformProperty} from "@/lib/real-estate/propertyService";
import {validPropertySlug} from "@/lib/real-estate/property-seo";

/**
 * All fields here are sourced from the already-public project record.
 * Historical CSV evidence is not an official, current project status.
 * Never forward arbitrary JSON evidence or private columns into the page.
 */
export type HistoricalProjectSnapshot = {
  projectType?: string;
  postalCode?: string;
  proposedCompletion?: string;
  sourceModified?: string;
  recordedStatus?: string;
};
const publicText = (value: unknown, max = 64): string | undefined =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max &&
  !/[<>\r\n]/.test(value) ? value.trim() : undefined;
const historicalDate = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(value) ? value : undefined;
};

export function parseHistoricalProjectSnapshot(value: unknown): HistoricalProjectSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  // This source type is explicitly historic and must not be represented as
  // a current official verification or a project-detail match.
  if (row.kind !== "operator_supplied_historic_csv_snapshot") return null;
  const projectType = publicText(row.source_project_type);
  const postalCode = typeof row.source_postal_code === "string" &&
    /^\d{6}$/.test(row.source_postal_code) ? row.source_postal_code : undefined;
  const proposedCompletion = historicalDate(row.proposed_completion_date);
  const sourceModified = historicalDate(row.source_last_modified);
  const recordedStatus = publicText(row.source_project_status);
  if (!projectType && !postalCode && !proposedCompletion && !sourceModified && !recordedStatus) return null;
  return {projectType,postalCode,proposedCompletion,sourceModified,recordedStatus};
}

/**
 * Public, RLS-scoped project snapshot for SEO/SSR. An unavailable database
 * must NEVER be mistaken for a nonexistent project (false crawler 404).
 * Cache successful public snapshots to reduce read load during crawl bursts.
 */
export const readPublicProjectForPage = unstable_cache(
  async (slug: string) => {
    if (!validPropertySlug(slug)) return null;
    try {
      const {data,error} = await supabase
        .from("properties")
        .select(PUBLIC_PROPERTY_FIELDS + ",registry_evidence")
        .eq("slug",slug)
        .limit(1)
        .abortSignal(AbortSignal.timeout(8000));
      if (error) throw new Error("public source unavailable");
      // Dynamic PostgREST select expressions cannot be fully inferred by supabase-js.
      // Validate the runtime row shape before narrowing to the requested public fields.
      const row = data?.[0] as unknown as Record<string, unknown> | undefined;
      if (!row || typeof row !== "object" || Array.isArray(row)) return null;
      const {registry_evidence, ...publicFields} = row;
      const property = transformProperty(publicFields);
      // Store only allowlisted, provenance-labelled historic fields in the
      // cached page payload; never serialize the full evidence JSON.
      return {...property,historicalRegistry:parseHistoricalProjectSnapshot(registry_evidence)};
    } catch {
      // Propagate a temporary server error, never return null/notFound().
      throw new Error("Public project record temporarily unavailable");
    }
  },
  ["gth-public-project-page-v1"],
  {revalidate: 1800},
);
