import "server-only";
import {createClient} from "@supabase/supabase-js";
import type {MetadataRoute} from "next";
import {isIndexableHotel,isIndexableTender,type HotelSeoRecord,type TenderSeoRecord} from "@/lib/seo/public-listings";
import {siteOrigin,isPublicLaunch} from "@/lib/seo/site";

/** Real-time, RLS-scoped SEO discovery. Each source view applies the same publication/rights gate.
 * A public OSM directory item is NOT a reviewed bookable Hotel/Tour/Attraction page.
 */
export const SEO_PAGE_SIZE=1000;
export const SEO_MAX_PAGES=500;
export const SEO_KINDS=["hotels","tours","destinations","attractions","tenders"] as const;
export type SeoKind=typeof SEO_KINDS[number];
const CONFIG:Record<SeoKind,{view:string;key:string;fields:string;path:string;priority:number;frequency:"weekly"|"monthly"|"daily"}>={
 hotels:{view:"gth_seo_hotels_v1",key:"id",fields:"id,name,city,country_code,category,source_name,source_url,affiliate_link,created_at",path:"/hotels/stay/",priority:.4,frequency:"weekly"},
 tours:{view:"gth_seo_tours_v1",key:"id",fields:"id,title,city,city_slug,country,provider,source_name,source_url,affiliate_link",path:"/tours/",priority:.4,frequency:"weekly"},
 destinations:{view:"gth_seo_destinations_v1",key:"slug",fields:"slug,name,country,description,source_name,source_url,created_at",path:"/destinations/",priority:.5,frequency:"weekly"},
 attractions:{view:"gth_seo_attractions_v1",key:"wikidata_qid",fields:"wikidata_qid,name,description,wikidata_url,updated_at",path:"/attractions/",priority:.35,frequency:"monthly"},
 tenders:{view:"gth_seo_tenders_v1",key:"id",fields:"id,title,buyer,country_code,sector,summary,deadline_at,source_name,source_reference,source_url,updated_at",path:"/tender/",priority:.5,frequency:"daily"}
};
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const QID=/^Q[1-9][0-9]{0,14}$/;
const SLUG=/^[a-z]+(?:-[a-z]+)*$/;
const PARTNER_HOSTS=["getyourguide.com","viator.com","klook.com","trip.com","booking.com","hotellook.com","expedia.com","tp.media","tpo.lv"];
function https(value:unknown):boolean{
 if(typeof value!=="string"||value.length>2048)return false;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname.includes(".")&&!u.username&&!u.password&&!u.port;}catch{return false;}
}
function tourPartner(value:unknown):boolean{
 if(!https(value))return false;
 const host=new URL(String(value)).hostname.toLowerCase();
 return PARTNER_HOSTS.some(domain=>host===domain||host.endsWith("."+domain));
}
export function isIndexableTour(row:Record<string,unknown>|null):boolean{
 return !!row&&UUID.test(String(row.id||""))&&
  typeof row.title==="string"&&row.title.trim().length>=12&&
  typeof row.city==="string"&&row.city.trim().length>=2&&
  typeof row.provider==="string"&&row.provider.trim().length>=2&&
  typeof row.source_name==="string"&&row.source_name.trim().length>=3&&
  https(row.source_url)&&tourPartner(row.affiliate_link)&&
  row.is_public!==false&&row.media_rights_verified!==false;
}
export function isIndexableDestination(row:Record<string,unknown>|null):boolean{
 return !!row&&typeof row.slug==="string"&&row.slug.length<=80&&SLUG.test(row.slug)&&
  typeof row.name==="string"&&row.name.trim().length>=3&&
  typeof row.description==="string"&&row.description.trim().length>=100&&
  typeof row.source_name==="string"&&row.source_name.trim().length>=3&&
  https(row.source_url)&&row.is_active!==false&&row.media_rights_verified!==false;
}
export function isIndexableAttraction(value:unknown):boolean{
 if(!value||typeof value!=="object")return false;
 const row=value as Record<string,unknown>;
 return typeof row.wikidata_qid==="string"&&QID.test(row.wikidata_qid)&&
  row.wikidata_url==="https://www.wikidata.org/wiki/"+row.wikidata_qid&&
  typeof row.name==="string"&&row.name.trim().length>=3&&
  typeof row.description==="string"&&row.description.trim().length>=90;
}
export function eligibleSeoRow(kind:SeoKind,row:Record<string,unknown>):boolean{
 if(kind==="hotels")return UUID.test(String(row.id||""))&&isIndexableHotel({
  name:row.name as string,city:row.city as string,country:row.country_code as string,
  category:(row.category as string)||"hotel",source:row.source_name as string,
  sourceUrl:row.source_url as string,partner:row.affiliate_link as string
 } satisfies HotelSeoRecord);
 if(kind==="tours")return isIndexableTour(row);
 if(kind==="destinations")return isIndexableDestination(row);
 if(kind==="attractions")return isIndexableAttraction(row);
 return isIndexableTender(row as unknown as TenderSeoRecord);
}
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("SEO public database is not configured");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function knownSeoKind(x:string):x is SeoKind{
 return SEO_KINDS.some(kind=>kind===x);
}
export async function seoShardCounts():Promise<{kind:SeoKind;count:number;pages:number}[]>{
 if(!isPublicLaunch())return [];
 const client=db();
 const output=await Promise.all(SEO_KINDS.map(async kind=>{
  const {count,error}=await client.from(CONFIG[kind].view).select(CONFIG[kind].key,{head:true,count:"exact"});
  if(error)throw new Error("SEO count unavailable: "+kind);
  const total=Math.max(0,count||0);
  return {kind,count:total,pages:Math.min(SEO_MAX_PAGES,Math.ceil(total/SEO_PAGE_SIZE))};
 }));
 return output;
}
export async function seoShard(kind:SeoKind,page:number):Promise<MetadataRoute.Sitemap>{
 if(!isPublicLaunch()||!Number.isInteger(page)||page<0||page>=SEO_MAX_PAGES)return [];
 const cfg=CONFIG[kind],start=page*SEO_PAGE_SIZE;
 const {data,error}=await db().from(cfg.view).select(cfg.fields)
  .order(cfg.key,{ascending:true}).range(start,start+SEO_PAGE_SIZE-1);
 if(error)throw new Error("SEO approved source query unavailable");
 const origin=siteOrigin();
 return ((data||[]) as unknown as Record<string,unknown>[]).filter(row=>eligibleSeoRow(kind,row))
  .map(row=>{
   const identifier=String(row[cfg.key]);
   const lastModifiedValue=(row.updated_at||row.created_at) as unknown;
   const lastModified=typeof lastModifiedValue==="string"&&Number.isFinite(Date.parse(lastModifiedValue))
    ?new Date(lastModifiedValue):undefined;
   return {url:origin+cfg.path+encodeURIComponent(identifier),...(lastModified?{lastModified}:{}),
    changeFrequency:cfg.frequency,priority:cfg.priority};
  });
}
