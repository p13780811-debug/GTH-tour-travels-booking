import "server-only";
import {unstable_cache} from "next/cache";
import {getPublicTender,getPublicTenderBatch,getTenderDiscoveryStats,parseTenderFilters,searchPublicTenders,type TenderFilters,type TenderResult} from "./catalog";
import {reserveTenderRefresh} from "./read-budget";
export const TENDER_READ_TTL=60;
const MAX_SNAPSHOT_AGE=5*60*1000;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function normalized(filters:TenderFilters):TenderFilters|null{
 const p=new URLSearchParams();
 for(const key of ["q","country","sector","closingBefore","closingWithin","sort","page","scope"] as const){const value=filters[key];if(value!==undefined&&value!=="")p.set(key,String(value));}
 if(!p.has("scope"))p.set("scope","world");
 const parsed=parseTenderFilters(p);if(!parsed.ok)return null;
 const query=parsed.filters.q.normalize("NFKC").replace(/\s+/g," ").toLocaleLowerCase("en");if(query.length>100)return null;
 return {...parsed.filters,q:query,
  nearby:parsed.filters.scope==="local"?[...new Set(filters.nearby??[])].filter(c=>/^[A-Z]{2}$/.test(c)&&c!==parsed.filters.country).sort().slice(0,12):[]};
}
// Coalesce a foreground refresh with Next's background revalidation. A first
// visitor after a quiet period waits for one fresh read, not an avoidable 503.
const filling=new Map<string,Promise<unknown>>();
function singleFill<T>(key:string,work:()=>Promise<T>):Promise<T>{
 const active=filling.get(key);if(active)return active as Promise<T>;
 const pending=Promise.resolve().then(work).finally(()=>filling.delete(key));filling.set(key,pending);return pending;
}
const freshSearch=(filters:TenderFilters)=>singleFill("search:"+JSON.stringify(filters),async()=>{
 await reserveTenderRefresh();const result=await searchPublicTenders(filters);
 if(!result.ok)throw Error(result.error);return {result,readAt:Date.now()};
});
const freshDetail=(id:string)=>singleFill("detail:"+id,async()=>{
 await reserveTenderRefresh();const result=await getPublicTender(id);
 if(!result.ok)throw Error(result.error);return {result,readAt:Date.now()};
});
const freshBatch=(ids:string[])=>singleFill("batch:"+ids.join(","),async()=>{
 await reserveTenderRefresh();const result=await getPublicTenderBatch(ids);
 if(!result.ok)throw Error(result.error);return {result,readAt:Date.now()};
});
const freshStats=(filters:TenderFilters)=>singleFill("stats:"+JSON.stringify(filters),async()=>{
 await reserveTenderRefresh();const result=await getTenderDiscoveryStats(filters);
 if(!result)throw Error("Tender counts unavailable");return {result,readAt:Date.now()};
});
const readSearch=unstable_cache(freshSearch,["gth-tender-search-v1"],{revalidate:TENDER_READ_TTL,tags:["gth-public-tenders"]});
const readDetail=unstable_cache(freshDetail,["gth-tender-detail-v1"],{revalidate:TENDER_READ_TTL,tags:["gth-public-tenders"]});
const readBatch=unstable_cache(freshBatch,["gth-tender-batch-v1"],{revalidate:TENDER_READ_TTL,tags:["gth-public-tenders"]});
const readStats=unstable_cache(freshStats,["gth-tender-facets-v1"],{revalidate:300,tags:["gth-public-tenders"]});
function usable(readAt:number,maxAge=MAX_SNAPSHOT_AGE){return Date.now()-readAt<=maxAge;}
function failure(error:unknown):Extract<TenderResult,{ok:false}>{
 const status=error&&typeof error==="object"&&"status" in error&&error.status===429?429:503;
 return {ok:false,status,error:status===429?"Catalogue refresh is busy. Your saved references are safe; retry shortly.":"Tender catalog temporarily unavailable"};
}
export async function searchCachedPublicTenders(filters:TenderFilters):Promise<TenderResult>{
 const key=normalized(filters);if(!key)return {ok:false,status:400,error:"Invalid tender filters"};
 if(key.scope==="local"&&!key.country)return {ok:true,items:[],total:0,page:key.page,size:12,countryRequired:true};
 try{
  let snapshot=await readSearch(key);if(!usable(snapshot.readAt))snapshot=await freshSearch(key);
  return {...snapshot.result,items:snapshot.result.items.filter(row=>Date.parse(row.deadline_at)>Date.now())};
 }catch(error){return failure(error);}
}
export async function getCachedPublicTender(id:string):ReturnType<typeof getPublicTender>{
 if(!uuid.test(id))return {ok:false,status:400,error:"Invalid tender ID"};
 try{
  let snapshot=await readDetail(id.toLowerCase());if(!usable(snapshot.readAt))snapshot=await freshDetail(id.toLowerCase());
  return {ok:true,item:snapshot.result.item&&Date.parse(snapshot.result.item.deadline_at)>Date.now()?snapshot.result.item:null};
 }catch(error){return failure(error);}
}
export async function getCachedTenderBatch(ids:string[]):Promise<TenderResult>{
 if(!ids.length||ids.length>40||new Set(ids.map(id=>id.toLowerCase())).size!==ids.length||ids.some(id=>!uuid.test(id)))return {ok:false,status:400,error:"Choose up to 40 valid tender references"};
 try{
  const key=ids.map(id=>id.toLowerCase()).sort();let snapshot=await readBatch(key);if(!usable(snapshot.readAt))snapshot=await freshBatch(key);
  return {...snapshot.result,items:snapshot.result.items.filter(row=>Date.parse(row.deadline_at)>Date.now())};
 }catch(error){return failure(error);}
}
export async function getCachedTenderStats(filters:TenderFilters){
 const key=normalized({...filters,q:"",sector:"",page:1,closingBefore:undefined,closingWithin:undefined,sort:"deadline"});
 if(!key||(key.scope==="local"&&!key.country))return null;
 try{let snapshot=await readStats(key);if(!usable(snapshot.readAt,10*60*1000))snapshot=await freshStats(key);return {...snapshot.result,checkedAt:new Date(snapshot.readAt).toISOString()};}catch{return null;}
}
/** Never share geo/language-derived API responses through the CDN. */
export function tenderResponseHeaders(params:URLSearchParams,deadlines:string[]){
 if(params.getAll("country").length!==1||params.getAll("lang").length!==1||!/^[A-Z]{2}$/i.test(params.get("country")??"")||!/^(en|hi|bn|ta|te|mr|fr|es|pt|de|ar|uk|ru|zh|ja)$/.test(params.get("lang")??""))return {"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
 const ttl=Math.max(0,Math.min(60,...deadlines.map(date=>Math.floor((Date.parse(date)-Date.now())/1000)-1).filter(Number.isFinite)));
 return {"Cache-Control":`public, max-age=0, s-maxage=${ttl}, must-revalidate`,"X-Content-Type-Options":"nosniff"};
}
