import {SITE_ORIGIN,normalizeQuery,searchTerm,type Pillar,approvedRecordPath} from "./routing";
export type DiscoveryKind=Exclude<Pillar,"travel">;
export type DiscoveryCard={
 id:string;kind:DiscoveryKind;title:string;subtitle:string;source:string;
 image?:string;webPath:string|null;tag?:string;
};
export type DiscoveryResponse={items:DiscoveryCard[];total:number};
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const string=(v:unknown,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
const names=(a:unknown[])=>a.slice(0,30);
export function mapSourceRows(kind:DiscoveryKind,value:unknown):DiscoveryResponse{
 const payload=obj(value);
 const rows:Array<unknown>=Array.isArray(value)?value:Array.isArray(payload.items)?payload.items:[];
 const items=names(rows).flatMap((row):DiscoveryCard[]=>{
  const v=obj(row);
  const title=string(kind==="hotel"?v.name:v.title,120);
  if(!title)return [];
  const id=String(v.id??v.slug??"").slice(0,140);
  const path=approvedRecordPath(kind,id)||(kind==="hotel"&&typeof v.id==="string"?approvedRecordPath(kind,v.id):null);
  const subtitle=kind==="hotel"?string(v.city||v.region||"Location to verify",120):
    kind==="tender"?string(v.buyer||v.country_code||"Published notice",120):
    string(v.city||v.location||v.country||"Public project record",120);
  const source=kind==="hotel"?string(v.source||"Hotel directory",80):
    kind==="tender"?string(v.source_name||"Official source",80):"Property registry / listing";
  const rawImage=kind==="hotel"?string(v.image,500):"";
  const image=rawImage.startsWith("https://")?rawImage:
    rawImage.startsWith("/")&&!rawImage.startsWith("//")?SITE_ORIGIN+rawImage:undefined;
  return [{id,kind,title,subtitle,source,image,webPath:path,tag:
   kind==="hotel"?(v.booking_ready===true?"Provider match available":"Directory record"):
   kind==="tender"?string(v.deadline_at,10):string(v.formatted_price||"",60)}];
 });
 const total=typeof payload.total==="number"&&Number.isFinite(payload.total)?payload.total:items.length;
 return {items,total};
}
export function endpointFor(kind:DiscoveryKind,raw:string):string {
 const q=normalizeQuery(raw);
 const term=searchTerm(q,kind)||q;
 const params=new URLSearchParams();
 if(kind==="hotel"){
  if(term)params.set(/\b(?:taj|marriott|hyatt|hilton)\b/i.test(term)&&term.split(/\s+/).length>2?"name":"city",term);
  params.set("source","all");
 }else if(kind==="property"){
  if(term)params.set("query",term);
 }else if(kind==="tender"){
  if(term)params.set("q",term);
  params.set("scope","local");
 }else{
  if(term)params.set("city",term);
 }
 params.set("page","1");
 const route={hotel:"/api/hotels",property:"/api/real-estate/search",tender:"/api/tender",tour:"/api/tours"}[kind];
 return SITE_ORIGIN+route+"?"+params.toString();
}
export async function getSourceCards(kind:DiscoveryKind,query:string,signal:AbortSignal):Promise<DiscoveryResponse>{
 const result=await fetch(endpointFor(kind,query),{
  method:"GET",signal,headers:{"Accept":"application/json"},
 });
 if(!result.ok)throw new Error("This source is unavailable right now. Try again.");
 const contentType=result.headers.get("content-type")||"";
 if(!contentType.toLowerCase().includes("json"))throw new Error("Unexpected source response.");
 const data:unknown=await result.json();
 return mapSourceRows(kind,data);
}
