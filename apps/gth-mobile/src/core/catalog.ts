import {SITE_ORIGIN,normalizeQuery,searchTerm,type Pillar,approvedRecordPath} from "./routing";

export type DiscoveryKind=Exclude<Pillar,"travel">;
export type DiscoveryCard={
 id:string;kind:DiscoveryKind;title:string;subtitle:string;source:string;
 image?:string;webPath:string|null;tag?:string;
};
export type DiscoveryResponse={items:DiscoveryCard[];total:number};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
const value=(v:unknown,max=160)=>typeof v==="string"?text(v,max):typeof v==="number"&&Number.isSafeInteger(v)?String(v):"";
const safeImage=(raw:unknown)=>{
 const image=text(raw,600);
 if(/^\/(?:images|app-brand)\/[a-zA-Z0-9/_-]+\.(?:png|jpg|jpeg|webp)$/.test(image))return SITE_ORIGIN+image;
 try{
  const url=new URL(image);
  if(url.protocol!=="https:"||url.username||url.password)return undefined;
  // Do not let database records load arbitrary image hosts on a customer's phone.
  if(["www.gthproglobal.com","gthproglobal.com","upload.wikimedia.org"].includes(url.hostname))
   return url.toString();
 }catch{/* No valid safe image. */}
 return undefined;
};
const limit=(raw:unknown)=>typeof raw==="number"&&Number.isInteger(raw)&&raw>=0?raw:0;

/** No fake data: all cards originate from the existing public web APIs. */
export function mapSourceRows(kind:DiscoveryKind,payload:unknown):DiscoveryResponse{
 const parent=object(payload);
 const rows=Array.isArray(payload)?payload:Array.isArray(parent.items)?parent.items:[];
 const seen=new Set<string>();
 const items=rows.slice(0,30).flatMap((row):DiscoveryCard[]=>{
  const data=object(row);
  const title=text(kind==="hotel"?data.name:data.title,120);
  if(!title)return [];
  // Hybrid property search exposes inventory/registry IDs AND listing slugs.
  // Only exact public slug can open a property detail page; UUID never becomes a slug.
  const id=kind==="property"?value(data.slug||data.inventory_slug||data.registry_slug||data.id,140):
   value(data.id,140);
  if(!id||seen.has(kind+":"+id))return [];
  seen.add(kind+":"+id);
  const detailId=kind==="property"?text(data.slug,140):id;
  const webPath=approvedRecordPath(kind,detailId);
  const subtitle=kind==="hotel"?text(data.city||data.region||"Location not stated",120):
    kind==="tender"?text(data.buyer||data.country_code||"Issuing authority",120):
    kind==="tour"?text(data.city||data.country||"Destination",120):
    text(data.city||data.location||data.region||data.country||"Property record",120);
  const source=kind==="hotel"?text(data.source||"Hotel directory",80):
    kind==="tender"?text(data.source_name||"Official procurement notice",80):
    kind==="tour"?"GTH PRO public experiences":"Property research";
  const image=safeImage(kind==="hotel"?data.image:
    kind==="tour"?data.image_url:data.image_url||data.image);
  const tag=kind==="hotel"?(data.booking_ready===true?"Verified property match — confirm live availability":"Accommodation record"):
    kind==="tender"?(text(data.deadline_at,10)?"Closes "+text(data.deadline_at,10):"Deadline: check source"):
    kind==="property"?text(data.formatted_price,60):
    text(data.category,50);
  return [{id,kind,title,subtitle,source,image,webPath,tag}];
 });
 return {items,total:limit(parent.total)||items.length};
}
const cityAndName=(query:string):{city:string;name:string}|null=>{
 const match=query.match(/^(.{2,60}?)\s+(?:hotels?|resorts?|stays?)\s+(?:in|near|at)\s+([\p{L}\p{M} .'-]{2,60})$/iu);
 if(!match)return null;
 const name=text(match[1],80).replace(/^\s*(?:find|search|book)\s+/i,"").trim();
 const city=text(match[2],80);
 return {city,name};
};
/** Existing validated endpoints; never copy Supabase connection or secrets to native. */
export function endpointFor(kind:DiscoveryKind,raw:string):string{
 const query=normalizeQuery(raw);
 const term=searchTerm(query,kind)||query;
 const params=new URLSearchParams();
 if(kind==="hotel"){
  const combined=cityAndName(query);
  const location=term.replace(/^hotels?\s+(?:in|near|at)\s+/i,"");
  if(combined){
   params.set("city",combined.city);
   if(combined.name)params.set("name",combined.name);
  }else if(location){
   const cityText=location.replace(/\s+(?:hotels?|resorts?|stays?)$/i,"").trim();
   if(/^\b(?:taj|marriott|hyatt|hilton|radisson|holiday inn)\b/i.test(cityText))params.set("name",cityText);
   else params.set("city",cityText);
  }
  params.set("source","all");
 }else if(kind==="property"){
  if(term)params.set("query",term);
 }else if(kind==="tender"){
  if(term)params.set("q",term);
  // No implied worldwide list. The server resolves a real audience for local scope.
  params.set("scope","local");
 }else if(term)params.set("city",term);
 params.set("page","1");
 const routes:Record<DiscoveryKind,string>={hotel:"/api/hotels",property:"/api/real-estate/search",
  tender:"/api/tender",tour:"/api/tours"};
 return SITE_ORIGIN+routes[kind]+"?"+params.toString();
}
export async function getSourceCards(kind:DiscoveryKind,query:string,signal:AbortSignal):Promise<DiscoveryResponse>{
 const result=await fetch(endpointFor(kind,query),{method:"GET",signal,headers:{"Accept":"application/json"}});
 if(!result.ok)throw Error("Source temporarily unavailable.");
 if(!(result.headers.get("content-type")||"").toLowerCase().includes("json"))
  throw Error("Unexpected source response.");
 const data:unknown=await result.json();
 return mapSourceRows(kind,data);
}
