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
