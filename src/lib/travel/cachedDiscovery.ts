import "server-only";
import {unstable_cache} from "next/cache";
import {sourceProgress} from "@/lib/travel/osmAttractions";
import {listMappedCities} from "@/lib/travel/mappedCities";

// These anonymous, source-backed directory summaries are shared across
// Attractions, Guides and Destinations. Cache successful reads for 5 minutes
// to avoid re-aggregating 160k+ OSM records on every visitor navigation.
// A provider failure throws: no fabricated totals and no cached error-as-zero.
export const cachedSourceProgress=unstable_cache(
  async()=>sourceProgress(),
  ["gth-osm-country-progress-v1"],
  {revalidate:300,tags:["gth-osm-discovery"]}
);
export const cachedHomepageCities=unstable_cache(
  async()=>listMappedCities({pageSize:48}),
  ["gth-osm-top-city-index-v1"],
  {revalidate:300,tags:["gth-osm-discovery"]}
);

/** A hard navigation budget, even when the remote PostgREST network promise never settles.
 * Reject rather than cache fabricated empty records; callers render editorial-only fallbacks.
 * The underlying Supabase queries also have AbortSignal timeouts.
 */
export async function withDiscoveryDeadline<T>(work:Promise<T>,ms=6_500):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([work,new Promise<never>((_resolve,reject)=>{
      timer=setTimeout(()=>reject(new Error("public_discovery_timeout")),ms);
    })]);
  }finally{if(timer)clearTimeout(timer)}
}
