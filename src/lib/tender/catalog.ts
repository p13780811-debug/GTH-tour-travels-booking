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
export type TenderFilters = { q: string; country: string; sector: string; closingBefore?: string; closingWithin?: "7"; sort?: "deadline"|"newest"; page: number; scope?: "local"|"world"; nearby?: string[] };
export type TenderResult =
 | { ok: true; items: PublicTender[]; total: number; page: number; size: number; primaryCount?: number; nearbyCount?: number; countryRequired?: boolean; stats?: TenderDiscoveryStats }
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
  const closingWithin=params.get("closingWithin") ?? "";
  if(closingWithin && closingWithin!=="7")return {ok:false,error:"Invalid closing soon filter"};
  const sort=params.get("sort")??"deadline";
  if(sort!=="deadline"&&sort!=="newest")return {ok:false,error:"Invalid sort order"};
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
  return { ok: true, filters: { q, country, sector, closingBefore, closingWithin:closingWithin==="7"?"7":undefined, sort, page: Number(rawPage), scope } };
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


export type TenderDiscoveryStats = {
  sectors: Record<TenderSector, number>;
  closingSoon7: number;
  latestImportedAt: string | null;
};

type TenderMarketSnapshot = TenderDiscoveryStats & {
  totalFiltered: number;
  homeCount: number;
  nearbyCount: number;
};

function asNonNegativeInteger(value: unknown) {
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?Math.trunc(n):0;
}

async function getTenderMarketSnapshot(filters:TenderFilters):Promise<TenderMarketSnapshot|null>{
  const db=publicClient();
  if(!db) return null;
  if(filters.scope==="local"&&!filters.country) {
    return {
      totalFiltered:0,homeCount:0,nearbyCount:0,
      sectors:{works:0,goods:0,services:0,consultancy:0,other:0},
      closingSoon7:0,latestImportedAt:null
    };
  }
  const nearby=filters.scope==="local"
    ? (filters.nearby??[]).filter(c=>c!==filters.country&&/^[A-Z]{2}$/.test(c)).slice(0,12)
    : [];
  const closingBefore=filters.closingBefore
    ? filters.closingBefore+"T23:59:59.999Z"
    : null;
  const closingWithin=filters.closingWithin==="7"
    ? new Date(Date.now()+7*86400000).toISOString()
    : null;
  try{
    const {data,error}=await db.rpc("gth_tender_market_metrics",{
      p_home_country:filters.country||null,
      p_nearby:nearby,
      p_sector:filters.sector||null,
      p_query:filters.q||null,
      p_closing_before:closingBefore,
      p_closing_within:closingWithin
    });
    if(error||!data||typeof data!=="object"||Array.isArray(data)) return null;
    const row=data as Record<string,unknown>;
    const rawSectors=(row.sectors&&typeof row.sectors==="object"&&!Array.isArray(row.sectors))
      ? row.sectors as Record<string,unknown>
      : {};
    return {
      totalFiltered:asNonNegativeInteger(row.total_filtered),
      homeCount:asNonNegativeInteger(row.home_count),
      nearbyCount:asNonNegativeInteger(row.nearby_count),
      sectors:{
        works:asNonNegativeInteger(rawSectors.works),
        goods:asNonNegativeInteger(rawSectors.goods),
        services:asNonNegativeInteger(rawSectors.services),
        consultancy:asNonNegativeInteger(rawSectors.consultancy),
        other:asNonNegativeInteger(rawSectors.other)
      },
      closingSoon7:asNonNegativeInteger(row.closing_soon_7),
      latestImportedAt:typeof row.latest_imported_at==="string"?row.latest_imported_at:null
    };
  }catch{return null;}
}

export async function searchPublicTenders(filters: TenderFilters): Promise<TenderResult> {
  const db = publicClient();
  if (!db) return {ok:false,status:503,error:"Tender catalog is not configured"};
  if (filters.scope === "local" && !filters.country) {
    return {ok:true,items:[],total:0,page:filters.page,size:PAGE_SIZE,countryRequired:true,
      stats:{sectors:{works:0,goods:0,services:0,consultancy:0,other:0},closingSoon7:0,latestImportedAt:null}};
  }
  try {
    const snapshot=await getTenderMarketSnapshot(filters);
    if(!snapshot) throw new Error("Tender metrics unavailable");
    const makeQuery = () => {
      let query = db.from("tenders").select(PUBLIC_COLUMNS)
        .eq("status","published").eq("source_verified",true).eq("is_public",true)
        .gt("deadline_at",new Date().toISOString());
      if(filters.sector) query=query.eq("sector",filters.sector);
      if(filters.closingBefore) query=query.lte("deadline_at",filters.closingBefore+"T23:59:59.999Z");
      if(filters.closingWithin==="7") query=query.lte("deadline_at",new Date(Date.now()+7*86400000).toISOString());
      if(filters.q){
        const escaped=filters.q.replace(/[\\%_]/g,(v)=>"\\"+v);
        query=query.ilike("title","%"+escaped+"%");
      }
      return query;
    };
    const stats:TenderDiscoveryStats={
      sectors:snapshot.sectors,closingSoon7:snapshot.closingSoon7,latestImportedAt:snapshot.latestImportedAt
    };
    const offset=(filters.page-1)*PAGE_SIZE;
    const sorting=(q:ReturnType<typeof makeQuery>)=> filters.sort==="newest"
      ? q.order("imported_at",{ascending:false}).order("id",{ascending:true})
      : q.order("deadline_at",{ascending:true}).order("id",{ascending:true});

    if(filters.scope==="world" || !filters.scope) {
      let query=makeQuery();
      if(filters.country) query=query.eq("country_code",filters.country);
      const {data,error}=await sorting(query).range(offset,offset+PAGE_SIZE-1);
      if(error?.code==="PGRST103")
        return {ok:true,items:[],total:snapshot.totalFiltered,page:filters.page,size:PAGE_SIZE,stats};
      if(error) throw error;
      return {ok:true,items:(data??[]) as PublicTender[],total:snapshot.totalFiltered,page:filters.page,size:PAGE_SIZE,stats};
    }

    const home=filters.country;
    const neighbours=(filters.nearby??[]).filter(c=>c!==home&&/^[A-Z]{2}$/.test(c)).slice(0,12);
    const homeCount=snapshot.homeCount;
    const nearCount=snapshot.nearbyCount;
    let homeItems:PublicTender[]=[];
    if(offset<homeCount){
      const h=await sorting(makeQuery().eq("country_code",home))
        .range(offset,Math.min(homeCount-1,offset+PAGE_SIZE-1));
      if(h.error&&h.error.code!=="PGRST103")throw h.error;
      homeItems=(h.data??[]) as PublicTender[];
    }
    const remaining=PAGE_SIZE-homeItems.length;
    const nearOffset=Math.max(0,offset-homeCount);
    let extra:PublicTender[]=[];
    if(remaining>0 && offset+homeItems.length>=homeCount && nearOffset<nearCount && neighbours.length){
      const nearbyRows=await sorting(makeQuery().in("country_code",neighbours))
        .range(nearOffset,Math.min(nearCount-1,nearOffset+remaining-1));
      if(nearbyRows.error&&nearbyRows.error.code!=="PGRST103") throw nearbyRows.error;
      extra=(nearbyRows.data??[]) as PublicTender[];
    }
    return {ok:true,items:[...homeItems,...extra],total:snapshot.totalFiltered,
      primaryCount:homeCount,nearbyCount:nearCount,page:filters.page,size:PAGE_SIZE,stats};
  } catch {
    return {ok:false,status:503,error:"Tender catalog unavailable"};
  }
}

export async function getTenderDiscoveryStats(filters: TenderFilters): Promise<TenderDiscoveryStats | null> {
  const snapshot=await getTenderMarketSnapshot(filters);
  if(!snapshot)return null;
  return {sectors:snapshot.sectors,closingSoon7:snapshot.closingSoon7,latestImportedAt:snapshot.latestImportedAt};
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
