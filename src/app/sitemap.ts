import type { MetadataRoute } from "next";
import { destinations } from "@/data/destinations";
import { airports } from "@/lib/travel/nuiteeAirportDirectory";
import { blogs } from "@/data/blogs";
import { siteOrigin } from "@/lib/seo/site";
import { createClient } from "@supabase/supabase-js";
import { isIndexableHotel, isIndexableTender, type HotelSeoRecord, type TenderSeoRecord } from "@/lib/seo/public-listings";
import {indexableGuidePaths} from "@/lib/travel/guideMedia";
import {HOTEL_MARKETS} from "@/lib/travel/nuitee-hotel-markets";
import { stadiums } from "@/lib/travel/stadiums";
const base = siteOrigin();
// Recheck published public inventory hourly as records are approved or expire.
export const revalidate = 3600;
const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
const pages = [
  "/", "/mega-aggregator", "/travel", "/travel/airports", "/flights", "/hotels", "/tours",
  "/destinations", "/guides", "/blog", "/bus", "/train", "/ferry", "/transfers", "/cars", "/cruises", "/stadiums", "/tickets", "/hotels/list-your-property",
  "/insurance", "/real-estate", "/real-estate/registry", "/real-estate/tools", "/real-estate/worldwide", "/real-estate/market-intelligence", "/tender", "/tender/services", "/tender/coverage",
  "/partners", "/contact", "/about", "/verification", "/affiliate-disclosure", "/real-estate/guides", "/knowledge/tenders",
  "/privacy-policy", "/terms-and-conditions", "/refund-policy",
  
];
type DynamicEntry = MetadataRoute.Sitemap[number];
const MAX_APPROVED_PER_SOURCE = 1000;
async function publishedRecords(): Promise<DynamicEntry[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  const signal = AbortSignal.timeout(5_000);
  // Public anon/RLS-scoped reads only, with explicit, narrow published-source filters.
  // Bounded query sizes keep sitemap requests responsive; never leak private columns.
  const [hotels, tenders, attractions] = await Promise.allSettled([
    db.from("hotels")
      .select("id,name,city,country_code,category,source_name,source_url,affiliate_link")
      .eq("is_public", true).eq("media_rights_verified", true)
      .not("source_name", "is", null).not("source_url", "is", null)
      .order("id", { ascending: true }).limit(MAX_APPROVED_PER_SOURCE).abortSignal(signal),
    db.from("tenders")
      .select("id,title,buyer,country_code,sector,summary,deadline_at,source_name,source_reference,source_url,updated_at")
      .eq("is_public", true).eq("source_verified", true).eq("status", "published")
      .gt("deadline_at", now)
      .not("summary", "is", null)
      .order("deadline_at", { ascending: true }).limit(MAX_APPROVED_PER_SOURCE).abortSignal(signal),
    db.from("gth_open_attractions")
      .select("wikidata_qid,name,description,source_license,wikidata_url")
      .eq("is_public",true).eq("source_license","CC0-1.0")
      .not("description","is",null)
      .order("wikidata_qid",{ascending:true}).limit(500).abortSignal(signal),
  ]);
  const output: DynamicEntry[] = [];
  if (hotels.status === "fulfilled" && !hotels.value.error) {
    for (const item of hotels.value.data ?? []) {
      const record: HotelSeoRecord = {
        name: item.name, city: item.city, country: item.country_code, category: item.category||"hotel",
        source: item.source_name, sourceUrl: item.source_url,
        partner: item.affiliate_link,
      };
      if (!isIndexableHotel(record) || !/^[a-f\d]{8}-[a-f\d-]{27,36}$/i.test(item.id)) continue;
      output.push({
        url: base + "/hotels/stay/" + encodeURIComponent(item.id),
        changeFrequency: "weekly", priority: 0.4,
      });
    }
  }
  if (tenders.status === "fulfilled" && !tenders.value.error) {
    for (const item of tenders.value.data ?? []) {
      if (!isIndexableTender(item as TenderSeoRecord)) continue;
      output.push({
        url: base + "/tender/" + encodeURIComponent(item.id),
        ...(typeof item.updated_at === "string" && Number.isFinite(Date.parse(item.updated_at))
          ? { lastModified: new Date(item.updated_at) } : {}),
        changeFrequency: "daily", priority: 0.5,
      });
    }
  }
  if(attractions.status==="fulfilled"&&!attractions.value.error){
    for(const item of attractions.value.data??[]){
      if(!/^Q[1-9][0-9]{0,14}$/.test(item.wikidata_qid)||
        typeof item.name!=="string"||item.name.length<3||
        typeof item.description!=="string"||item.description.trim().length<90||
        item.wikidata_url!=="https://www.wikidata.org/wiki/"+item.wikidata_qid)continue;
      output.push({url:base+"/attractions/"+item.wikidata_qid,changeFrequency:"monthly",priority:0.35});
    }
  }
  return output;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Preview builds must not advertise unlaunched or unverified services for indexing.
  if (!publicLaunch) return [];
  // Property URLs are already partitioned across /seo-sitemaps/properties/*.xml.
  // Do not duplicate the first 1,000 properties in the root sitemap or pay for a repeated query.
  const [approved,guidePaths]=await Promise.all([publishedRecords().catch(() => [] as DynamicEntry[]),indexableGuidePaths().catch(()=>[] as string[])]);
  return [
    ...pages.map(path => ({ url: base + (path === "/" ? "" : path), changeFrequency: "weekly" as const, priority: path === "/" || path === "/mega-aggregator" ? 1 : 0.6 })),
    ...stadiums.map(venue => ({ url: base + "/stadiums/" + venue.slug, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...["sports","concerts","theatre","comedy","festivals","attractions","museums","theme-parks","cinema"].map(category=>({url:base+"/tickets/"+category,changeFrequency:"monthly" as const,priority:0.55})),
    ...destinations.map(d => ({ url: base + "/destinations/" + d.slug, changeFrequency: "weekly" as const, priority: 0.5 })),
    // Bounded, human-reviewed destination guides; no supplier calls or DB reads in sitemap generation.
    // Hotel ID profiles remain noindex until individually approved for original-content publication.
    ...HOTEL_MARKETS.map(market=>({url:base+"/hotels/explore/"+market.slug,changeFrequency:"monthly" as const,priority:0.45})),
    ...airports.map(airport => ({ url: base + "/travel/airports/" + airport.code.toLowerCase(), changeFrequency: "monthly" as const, priority: 0.45 })),
    ...blogs.map(article => ({ url: base + "/blog/" + article.slug, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...approved,
    ...guidePaths.map(slug=>({url:base+"/guides/"+slug,changeFrequency:"monthly" as const,priority:0.55})),
  ];
}
