import { createClient } from "@supabase/supabase-js";
import type { TenderRequirements } from "@/lib/tender/eligibility";

export const TENDER_SECTORS = ["works", "goods", "services", "consultancy", "other"] as const;
export type TenderSector = typeof TENDER_SECTORS[number];
const PUBLIC_COLUMNS = "id,title,buyer,country_code,region,sector,summary,deadline_at,published_at,estimated_value,currency,source_name,source_reference,source_url,eligibility_requirements,requirements_verified";
const PAGE_SIZE = 12;

export type PublicTender = {
  id: string; title: string; buyer: string; country_code: string; region: string | null;
  sector: TenderSector; summary: string | null; deadline_at: string; published_at: string | null;
  estimated_value: number | null; currency: string | null; source_name: string;
  source_reference: string; source_url: string;
  eligibility_requirements: TenderRequirements; requirements_verified: boolean;
};
export type TenderFilters = { q: string; country: string; sector: string; closingBefore?: string; page: number; scope?: "local"|"world"; nearby?: string[] };
export type TenderResult =
 | { ok: true; items: PublicTender[]; total: number; page: number; size: number; primaryCount?: number; nearbyCount?: number; countryRequired?: boolean }
 | { ok: false; status: number; error: string };

export function parseTenderFilters(params: URLSearchParams):
 | { ok: true; filters: TenderFilters }
 | { ok: false; error: string } {
  const q = (params.get("q") ?? "").trim();
  const country = (params.get("country") ?? "").trim().toUpperCase();
  const sector = (params.get("sector") ?? "").trim().toLowerCase();
  const closingBefore = (params.get("closingBefore") ?? "").trim();
  const scope = params.get("scope") ?? "local";
  if (scope !== "local" && scope !== "world") return {ok:false,error:"Invalid search area"};
  const rawPage = params.get("page") ?? "1";
  if (q.length > 100 || /[\u0000-\u001f]/.test(q)) return { ok: false, error: "Invalid search" };
  if (country && !/^[A-Z]{2}$/.test(country)) return { ok: false, error: "Country must be a two-letter ISO code" };
  if (sector && !TENDER_SECTORS.includes(sector as TenderSector)) return { ok: false, error: "Invalid sector" };
  if (closingBefore) {
    const parsed = new Date(closingBefore);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closingBefore) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== closingBefore)
      return { ok: false, error: "Invalid closing date" };
  }
  if (!/^[1-9]\d{0,2}$/.test(rawPage) || Number(rawPage) > 100)
    return { ok: false, error: "Invalid page" };
  return { ok: true, filters: { q, country, sector, closingBefore, page: Number(rawPage), scope } };
}

export function safeTenderSource(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port ||
        u.hostname === "localhost" || u.hostname.endsWith(".localhost") ||
        /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname.includes(":") ||
        !u.hostname.includes(".") ) return null;
    return u.toString();
  } catch { return null; }
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  }) : null;
}

export async function searchPublicTenders(filters: TenderFilters): Promise<TenderResult> {
  const db = publicClient();
  if (!db) return {ok:false,status:503,error:"Tender catalog is not configured"};
  // Local mode requires either a user-selected ISO country or a Vercel-detected country.
  // No location does NOT mean 'show random global inventory'.
  if (filters.scope === "local" && !filters.country) {
    return {ok:true,items:[],total:0,page:filters.page,size:PAGE_SIZE,countryRequired:true};
  }
  try {
    const makeQuery = () => {
      let query = db.from("tenders").select(PUBLIC_COLUMNS,{count:"exact"})
        .eq("status","published").eq("source_verified",true).eq("is_public",true)
        .gt("deadline_at",new Date().toISOString());
      if(filters.sector) query=query.eq("sector",filters.sector);
      if(filters.closingBefore) query=query.lte("deadline_at",filters.closingBefore+"T23:59:59.999Z");
      if(filters.q){
        const escaped=filters.q.replace(/[\\%_]/g,(v)=>"\\"+v);
        query=query.ilike("title","%"+escaped+"%");
      }
      return query;
    };
    const offset=(filters.page-1)*PAGE_SIZE;
    const sorting=(q:ReturnType<typeof makeQuery>)=>q.order("deadline_at",{ascending:true}).order("id",{ascending:true});
    // World search is an *explicit* user choice. Legacy callers without a
    // scope continue to work; the tender page/API always provide one.
    if(filters.scope==="world" || !filters.scope) {
      let query=makeQuery();
      if(filters.country) query=query.eq("country_code",filters.country);
      const {data,error,count}=await sorting(query).range(offset,offset+PAGE_SIZE-1);
      if(error) throw error;
      return {ok:true,items:(data??[]) as PublicTender[],total:count??0,page:filters.page,size:PAGE_SIZE};
    }
    const home=filters.country;
    const neighbours=(filters.nearby??[]).filter(c=>c!==home&&/^[A-Z]{2}$/.test(c)).slice(0,12);
    const h=await sorting(makeQuery().eq("country_code",home)).range(offset,offset+PAGE_SIZE-1);
    if(h.error) throw h.error;
    const homeCount=h.count??0;
    const homeItems=(h.data??[]) as PublicTender[];
    if(neighbours.length===0){
      return {ok:true,items:homeItems,total:homeCount,primaryCount:homeCount,nearbyCount:0,page:filters.page,size:PAGE_SIZE};
    }
    // First count nearby without retrieving a whole global catalog. RLS
    // restricts both queries to reviewed, public, current notices.
    const nearCountResult=await makeQuery().in("country_code",neighbours)
      .order("deadline_at",{ascending:true}).limit(1);
    if(nearCountResult.error) throw nearCountResult.error;
    const nearCount=nearCountResult.count??0;
    const remaining=PAGE_SIZE-homeItems.length;
    let extra:PublicTender[]=[];
    if(remaining>0 && offset+homeItems.length>=homeCount && nearCount>0){
      const nearOffset=Math.max(0,offset-homeCount);
      const nearbyRows=await sorting(makeQuery().in("country_code",neighbours))
        .range(nearOffset,nearOffset+remaining-1);
      if(nearbyRows.error) throw nearbyRows.error;
      extra=(nearbyRows.data??[]) as PublicTender[];
    }
    return {ok:true,items:[...homeItems,...extra],total:homeCount+nearCount,
      primaryCount:homeCount,nearbyCount:nearCount,page:filters.page,size:PAGE_SIZE};
  } catch {
    return {ok:false,status:503,error:"Tender catalog unavailable"};
  }
}

export type TenderDiscoveryStats = {
  sectors: Record<TenderSector, number>;
  closingSoon7: number;
  latestImportedAt: string | null;
};

/**
 * Public/RLS-scoped, live query-backed marketplace facets. These are true
 * approved ACTIVE notice counts in the selected geographic area; never demo
 * numbers, estimated totals or claimed real-time stream event counts.
 * A separate latest-imported timestamp is deliberately NOT called "last sync":
 * duplicate-only ingestion jobs do not update imported_at.
 */
export async function getTenderDiscoveryStats(filters: TenderFilters): Promise<TenderDiscoveryStats | null> {
  const db=publicClient();
  if(!db) return null;
  if(filters.scope==="local" && !filters.country) return null;
  const countries=filters.scope==="local"
    ? Array.from(new Set([filters.country,...(filters.nearby??[])]))
        .filter(c=>/^[A-Z]{2}$/.test(c)).slice(0,13)
    : filters.country?[filters.country]:[];
  const base = () => {
    let query=db.from("tenders")
      .select("id",{count:"exact",head:true})
      .eq("status","published").eq("source_verified",true).eq("is_public",true)
      .gt("deadline_at",new Date().toISOString());
    if(countries.length) query=query.in("country_code",countries);
    return query;
  };
  try {
    const cutoff=new Date(Date.now()+7*86400000).toISOString();
    const sectorJobs=TENDER_SECTORS.map(sector=>base().eq("sector",sector));
    const newest=db.from("tenders").select("imported_at")
      .eq("status","published").eq("source_verified",true).eq("is_public",true)
      .gt("deadline_at",new Date().toISOString())
      .order("imported_at",{ascending:false}).limit(1);
    if(countries.length) newest.in("country_code",countries);
    const results=await Promise.all([
      ...sectorJobs,
      base().lte("deadline_at",cutoff),
      newest
    ]);
    if(results.some(r=>r.error)) return null;
    const sectors=Object.fromEntries(
      TENDER_SECTORS.map((sector,index)=>[sector,results[index].count??0])
    ) as Record<TenderSector,number>;
    const latest=results[results.length-1];
    const lastRow=Array.isArray(latest.data)?latest.data[0]:null;
    return {
      sectors,
      closingSoon7:results[TENDER_SECTORS.length].count??0,
      latestImportedAt:lastRow && typeof lastRow.imported_at==="string"?lastRow.imported_at:null
    };
  } catch {return null;}
}

export async function getPublicTender(id: string):
 Promise<{ok:true;item:PublicTender|null}|{ok:false;status:number;error:string}> {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))
    return { ok: false, status: 400, error: "Invalid tender ID" };
  const db = publicClient();
  if (!db) return { ok: false, status: 503, error: "Tender catalog is not configured" };
  try {
    const { data, error } = await db.from("tenders").select(PUBLIC_COLUMNS)
      .eq("id", id).eq("status", "published").eq("source_verified", true).eq("is_public", true)
      .gt("deadline_at", new Date().toISOString()).maybeSingle();
    if (error) return {ok:false,status:503,error:"Tender catalog unavailable"};
    return {ok:true,item:data as PublicTender | null};
  } catch {return {ok:false,status:503,error:"Tender catalog unavailable"};}
}
