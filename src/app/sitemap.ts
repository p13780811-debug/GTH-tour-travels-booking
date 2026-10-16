import type { MetadataRoute } from "next";
import { destinations } from "@/data/destinations";
import { blogs } from "@/data/blogs";
import { siteOrigin } from "@/lib/seo/site";
import { createClient } from "@supabase/supabase-js";
import { isIndexableHotel, isIndexableTender, type HotelSeoRecord, type TenderSeoRecord } from "@/lib/seo/public-listings";
const base = siteOrigin();
// Recheck published public inventory hourly as records are approved or expire.
export const revalidate = 3600;
const publicLaunch = process.env.VERCEL_ENV === "production" &&
  process.env.GTH_PUBLIC_LAUNCH_ENABLED === "true";
const pages = [
  "/", "/mega-aggregator", "/travel", "/flights", "/hotels", "/tours",
  "/destinations", "/guides", "/blog", "/bus", "/train", "/transfers", "/cars",
  "/insurance", "/real-estate", "/real-estate/tools", "/tender",
  "/partners", "/contact", "/about", "/affiliate-disclosure",
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
  // Public anon/RLS-scoped reads only, with explicit, narrow published-source filters.
  // Bounded query sizes keep sitemap requests responsive; never leak private columns.
  const [hotels, tenders] = await Promise.allSettled([
    db.from("hotels")
      .select("id,name,city,source_name,source_url,affiliate_link")
      .eq("is_public", true).eq("media_rights_verified", true)
      .not("source_name", "is", null).not("source_url", "is", null)
      .not("affiliate_link", "is", null)
      .order("id", { ascending: true }).limit(MAX_APPROVED_PER_SOURCE),
    db.from("tenders")
      .select("id,title,buyer,country_code,sector,summary,deadline_at,source_name,source_reference,source_url,updated_at")
      .eq("is_public", true).eq("source_verified", true).eq("status", "published")
      .gt("deadline_at", now)
      .not("summary", "is", null)
      .order("deadline_at", { ascending: true }).limit(MAX_APPROVED_PER_SOURCE),
  ]);
  const output: DynamicEntry[] = [];
  if (hotels.status === "fulfilled" && !hotels.value.error) {
    for (const item of hotels.value.data ?? []) {
      const record: HotelSeoRecord = {
        name: item.name, city: item.city, country: null, category: "hotel",
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
  return output;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Preview builds must not advertise unlaunched or unverified services for indexing.
  if (!publicLaunch) return [];
  const approved = await publishedRecords().catch(() => [] as DynamicEntry[]);
  return [
    ...pages.map(path => ({ url: base + (path === "/" ? "" : path), changeFrequency: "weekly" as const, priority: path === "/" || path === "/mega-aggregator" ? 1 : 0.6 })),
    ...destinations.map(d => ({ url: base + "/destinations/" + d.slug, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...blogs.map(article => ({ url: base + "/blog/" + article.slug, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...approved,
  ];
}
