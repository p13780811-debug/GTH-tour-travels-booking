import "server-only";
import {unstable_cache} from "next/cache";
import {supabase} from "@/lib/supabase";
import {PUBLIC_PROPERTY_FIELDS, transformProperty} from "@/lib/real-estate/propertyService";
import {validPropertySlug} from "@/lib/real-estate/property-seo";

/**
 * Public, RLS-scoped project snapshot for SEO/SSR.
 *
 * Unlike the generic marketplace lookup, an unavailable database must NOT be
 * mistaken for a missing project: a false 404 can cause search engines to
 * remove an otherwise valid URL. Cache successful public snapshots to reduce
 * repeated reads during crawl bursts; errors are never cached as 404s.
 *
 * No private keys, privileged data, or extra provider API calls.
 */
export const readPublicProjectForPage = unstable_cache(
  async (slug: string) => {
    if (!validPropertySlug(slug)) return null;
    try {
      const {data,error} = await supabase
        .from("properties")
        .select(PUBLIC_PROPERTY_FIELDS)
        .eq("slug",slug)
        .limit(1)
        .abortSignal(AbortSignal.timeout(8000));
      if (error) throw new Error("public source unavailable");
      return data?.[0] ? transformProperty(data[0]) : null;
    } catch {
      // Propagate a temporary server error, never return null/notFound().
      throw new Error("Public project record temporarily unavailable");
    }
  },
  ["gth-public-project-page-v1"],
  {revalidate: 1800},
);
