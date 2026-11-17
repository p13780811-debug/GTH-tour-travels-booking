import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { readInfraPulse } from "./infraPulse";
import type { InfraPulse } from "./contracts";
import { osmPlacePath } from "@/lib/travel/osm-place";
import { findGthMarket, type GthMarket } from "./markets";

export type MarketProperty = {
  id: number; title: string; slug: string; city: string; projectReference: string | null;
  officialSourceUrl: string | null; status: string | null;
};
export type MarketTender = {
  id: string; title: string; buyer: string; region: string; deadlineAt: string; sourceReference: string;
};
export type MarketDirectoryPlace = { name: string; city: string; url: string; type: string };
export type MarketAttraction = { name: string; city: string; url: string; category: string };
export type MarketDecision = {
  market: GthMarket;
  properties: MarketProperty[];
  tenders: MarketTender[];
  hotelDirectory: MarketDirectoryPlace[];
  attractions: MarketAttraction[];
  pulses: Record<number, InfraPulse>;
  unavailable: string[];
  checkedAt: string;
};

function safeSource(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 1024) return null;
  try { const url = new URL(input); return url.protocol === "https:" && !url.username && !url.password && !url.port &&
    url.hostname.includes(".") && !/^\d+(?:\.\d+){3}$/.test(url.hostname) ? url.href : null; } catch { return null; }
}
/**
 * All reads run with anon RLS and strict public-source conditions, bounded by
 * country and city. These are editorial directory records, NOT inventory quotes.
 */
const cachedRead = unstable_cache(async (slug: string): Promise<MarketDecision | null> => {
  const market = findGthMarket(slug);
  if (!market) return null;
  const empty: MarketDecision = {
    market, properties:[], tenders:[], hotelDirectory:[], attractions:[], pulses:{}, unavailable:[],
    checkedAt:new Date().toISOString(),
  };
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {...empty,unavailable:["Property registry","Tender notices","Hotel directory","Attractions"]};
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const escapedCity=market.city.replace(/[\\%_]/g,v=>"\\"+v);
  const now=new Date().toISOString();
  const queries=await Promise.allSettled([
    db.from("properties")
      .select("id,title,slug,city,official_source_reference,official_source_url,status")
      .eq("country",market.countryName).ilike("city",market.city).order("id",{ascending:true}).limit(8)
      .abortSignal(AbortSignal.timeout(4200)),
    db.from("tenders")
      .select("id,title,buyer,region,deadline_at,source_reference")
      .eq("country_code",market.countryCode).eq("is_public",true).eq("source_verified",true)
      .eq("status","published").gt("deadline_at",now)
      .ilike("region","%"+escapedCity+"%").order("deadline_at",{ascending:true}).limit(6)
      .abortSignal(AbortSignal.timeout(4200)),
    db.from("hotel_catalog")
      .select("name,city,category,source_url,source_license")
      .eq("country_code",market.countryCode).ilike("city",market.city)
      .order("name",{ascending:true}).limit(6).abortSignal(AbortSignal.timeout(4200)),
    db.from("gth_osm_attractions")
      .select("source_id,name,city,category,source_url,source_license")
      .eq("is_public",true).eq("country_code",market.countryCode).ilike("city",market.city)
      .order("source_id",{ascending:true}).limit(6).abortSignal(AbortSignal.timeout(4200)),
  ]);
  const data=(index:number,source:string):Record<string,unknown>[]=>{
    const settled=queries[index];
    if(settled.status!=="fulfilled" || settled.value.error) { empty.unavailable.push(source); return []; }
    return (settled.value.data??[]) as Record<string,unknown>[];
  };
  empty.properties=data(0,"Property registry").flatMap(row=>{
    const id=Number(row.id);
    if(!Number.isSafeInteger(id)||id<1 || typeof row.title!=="string" ||
      typeof row.slug!=="string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))return [];
    return [{id,title:row.title.slice(0,180),slug:row.slug,city:market.city,
      projectReference:typeof row.official_source_reference==="string"?row.official_source_reference.slice(0,90):null,
      officialSourceUrl:safeSource(row.official_source_url),status:typeof row.status==="string"?row.status:null}];
  }).slice(0,5);
  empty.tenders=data(1,"Tender notices").flatMap(row=>
    typeof row.id==="string"&&/^[0-9a-f-]{36}$/i.test(row.id)&&typeof row.title==="string" &&
    typeof row.deadline_at==="string"&&Date.parse(row.deadline_at)>Date.now()
      ?[{id:row.id,title:row.title.slice(0,180),buyer:String(row.buyer??"Issuing authority").slice(0,130),
        region:String(row.region??"").slice(0,110),deadlineAt:row.deadline_at,
        sourceReference:String(row.source_reference??"").slice(0,90)}]:[]).slice(0,5);
  empty.hotelDirectory=data(2,"Hotel directory").flatMap(row=>{
    const source=safeSource(row.source_url);
    return source&&row.source_license==="ODbL-1.0"&&typeof row.name==="string" && row.name.length>=2
      ?[{name:row.name.slice(0,120),city:market.city,url:source,type:typeof row.category==="string"?row.category:"mapped accommodation"}]:[];
  }).slice(0,5);
  empty.attractions=data(3,"Attractions").flatMap(row=>{
    const sourceId=typeof row.source_id==="string"?row.source_id:"";
    const href=osmPlacePath(sourceId);
    return href&&row.source_url==="https://www.openstreetmap.org/"+sourceId &&
      row.source_license==="ODbL-1.0"&&typeof row.name==="string"&&row.name.length>=3
      ?[{name:row.name.slice(0,150),city:market.city,url:href,
        category:typeof row.category==="string"?row.category:"mapped attraction"}]:[];
  }).slice(0,5);
  if(empty.properties.length)empty.pulses=await readInfraPulse(empty.properties.map(p=>p.id)).catch(()=>({}));
  return empty;
},["gth-market-decision-v1"],{revalidate:600});

export async function readMarketDecision(slug:string):Promise<MarketDecision|null> {
  const snapshot=await cachedRead(slug);
  if(!snapshot)return null;
  const now=Date.now();
  return {
    ...snapshot,
    tenders:snapshot.tenders.filter(item=>Date.parse(item.deadlineAt)>now),
    pulses:Object.fromEntries(Object.entries(snapshot.pulses).flatMap(([id,pulse])=>
      pulse.notices.every(notice=>Date.parse(notice.deadline)>now)?[[id,pulse]]:[])),
  };
}
export function marketIndexable(decision: MarketDecision):boolean {
  const verifiedSectors=(decision.properties.some(item=>item.officialSourceUrl&&item.projectReference)?1:0) +
    (decision.tenders.length?1:0)+(decision.attractions.length?1:0);
  // Hotel directory alone is not original or booking content.
  return verifiedSectors>=2&&decision.unavailable.length===0;
}