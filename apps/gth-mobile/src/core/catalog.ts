import {SITE_ORIGIN,normalizeQuery,searchTerm,type Pillar,approvedRecordPath} from "./routing";

export type DiscoveryKind=Exclude<Pillar,"travel">;
export type PhotoCredit={author:string;license:string;page:string;licenseUrl:string};
export type DiscoveryCard={
 id:string;kind:DiscoveryKind;title:string;subtitle:string;source:string;
 image?:string;webPath:string|null;tag?:string;
 facts?:{label:string;value:string}[];photoCredit?:PhotoCredit;bookingPath?:string;
 loadedAt?:string;
};
export type DiscoveryResponse={items:DiscoveryCard[];total:number;hasNext?:boolean;page?:number;totalIsExact?:boolean};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const text=(v:unknown,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
const value=(v:unknown,max=160)=>typeof v==="string"?text(v,max):typeof v==="number"&&Number.isSafeInteger(v)?String(v):"";
const safeImage=(raw:unknown)=>{
 const image=text(raw,1600);
 if(/^\/(?:images|app-brand)\/[a-zA-Z0-9/_-]+\.(?:png|jpg|jpeg|webp)$/.test(image))return SITE_ORIGIN+image;
 if(/^\/api\/property-media\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(image))return SITE_ORIGIN+image;
 try{
  const url=new URL(image);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash)return undefined;
  // Do not let database records load arbitrary image hosts on a customer's phone.
  if(["www.gthproglobal.com","gthproglobal.com","upload.wikimedia.org"].includes(url.hostname))
   return url.toString();
 }catch{/* No valid safe image. */}
 return undefined;
};
const limit=(raw:unknown)=>typeof raw==="number"&&Number.isInteger(raw)&&raw>=0?raw:0;
export function approvedCreditUrl(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length>1200)return null;
 try{
  const url=new URL(raw);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash||url.search)return null;
  return (url.hostname==="commons.wikimedia.org"&&url.pathname.startsWith("/wiki/File:")||
   url.hostname==="creativecommons.org"&&/^\/(?:licenses|publicdomain)\//.test(url.pathname))?url.toString():null;
 }catch{return null;}
}
/** Revalidate saved media as strictly as new API records; keep the license with
 * the image after a restart. Commons images without usable credit are omitted. */
export function recordExtras(raw:unknown):Pick<DiscoveryCard,"image"|"photoCredit"|"facts"|"loadedAt">{
 const data=object(raw),credit=object(data.photoCredit);
 const author=text(credit.author,120),license=text(credit.license,80);
 const page=approvedCreditUrl(credit.page),licenseUrl=approvedCreditUrl(credit.licenseUrl);
 const photoCredit=author&&license&&page?.startsWith("https://commons.wikimedia.org/")&&licenseUrl
  ?{author,license,page,licenseUrl}:undefined;
 let image=safeImage(data.image);
 if(image?.startsWith("https://upload.wikimedia.org/")&&!photoCredit)image=undefined;
 const facts=Array.isArray(data.facts)?data.facts.slice(0,6).flatMap(raw=>{
  const fact=object(raw),label=text(fact.label,30),value=text(fact.value,160);
  return label&&value?[{label,value}]:[];
 }):[];
 const loadedAt=typeof data.loadedAt==="string"&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(data.loadedAt)&&Number.isFinite(Date.parse(data.loadedAt))?data.loadedAt:undefined;
 return {image,photoCredit:image?photoCredit:undefined,facts,loadedAt};
}
function publicFacts(kind:DiscoveryKind,data:Record<string,unknown>):{label:string;value:string}[]{
 const pairs:unknown[][]=kind==="hotel"?[["Address",data.address],["Country",data.country],["Stay type",data.category]]:
  kind==="property"?[["Location",data.location],["Property type",data.property_type],["Published price",data.formatted_price],
   ["Published units",value(data.active_inventory_count)],["Registration",data.rera_id]]:
  kind==="tender"?[["Country",data.country_code],["Sector",data.sector],["Deadline (UTC)",data.deadline_at]]:
   [["Destination",data.city],["Country",data.country],["Experience type",data.category]];
 return pairs.flatMap(([label,raw])=>{const val=text(raw,160);return val?[{label:String(label),value:val}]:[];});
}
const maxPage=(kind:DiscoveryKind)=>kind==="hotel"||kind==="tender"?100:1000;

/** No fake data: all cards originate from the existing public web APIs. */
export function mapSourceRows(kind:DiscoveryKind,payload:unknown):DiscoveryResponse{
 const parent=object(payload);
 if(!Array.isArray(payload)&&!Array.isArray(parent.items))throw Error("Unexpected source response.");
 const rows=Array.isArray(payload)?payload:parent.items as unknown[];
 const seen=new Set<string>();
 const items=rows.slice(0,100).flatMap((row):DiscoveryCard[]=>{
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
  const media=Array.isArray(data.publishedMedia)?data.publishedMedia.map(object):[];
  const photo=media.find(item=>item.media_type==="photo"&&item.is_primary===true)||media.find(item=>item.media_type==="photo");
  const credit=object(data.image_attribution);
  const extras=recordExtras({
   image:kind==="hotel"?data.image:kind==="tour"?data.image_url:
    photo?"/api/property-media/"+value(photo.id):data.image_url||data.image,
   photoCredit:{author:credit.author,license:credit.license,page:credit.commons_page,licenseUrl:credit.license_url},
   facts:publicFacts(kind,data),
  });
  const tag=kind==="hotel"?(data.booking_ready===true?"Verified property match — confirm live availability":"Accommodation record"):
    kind==="tender"?(text(data.deadline_at,10)?"Closes "+text(data.deadline_at,10):"Deadline: check source"):
    kind==="property"?text(data.formatted_price,60):
    text(data.category,50);
  const bookingPath=kind==="hotel"&&data.booking_ready===true&&webPath
   ?"/hotels/partner/"+encodeURIComponent(id):undefined;
  return [{id,kind,title,subtitle,source,...extras,webPath,tag,bookingPath}];
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
export function endpointFor(kind:DiscoveryKind,raw:string,tenderRegion="IN",page=1):string{
 if(!Number.isInteger(page)||page<1||page>maxPage(kind))throw Error("Invalid result page.");
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
  // Mobile requests have no reliable Vercel visitor-country header.
  // Always show an explicit user-selected region; worldwide is opt-in.
  const region=/^[A-Z]{2}$/.test(tenderRegion)?tenderRegion:"IN";
  if(tenderRegion==="WORLD")params.set("scope","world");
  else {params.set("scope","local");params.set("country",region);}
 }else if(term)params.set("city",term);
 params.set("page",String(page));
 const routes:Record<DiscoveryKind,string>={hotel:"/api/hotels",property:"/api/real-estate/search",
  tender:"/api/tender",tour:"/api/tours"};
 return SITE_ORIGIN+routes[kind]+"?"+params.toString();
}
export async function getSourceCards(kind:DiscoveryKind,query:string,signal:AbortSignal,tenderRegion="IN",page=1):Promise<DiscoveryResponse>{
 const result=await fetch(endpointFor(kind,query,tenderRegion,page),{method:"GET",signal,headers:{"Accept":"application/json"}});
 if(!result.ok)throw Error("Source temporarily unavailable.");
 if(!(result.headers.get("content-type")||"").toLowerCase().includes("json"))
  throw Error("Unexpected source response.");
 const data:unknown=await result.json();
 const mapped=mapSourceRows(kind,data);
 const parent=object(data);
 const headerTotal=result.headers.get(kind==="hotel"?"X-GTH-Total":"X-Total-Count");
 const headerSize=result.headers.get(kind==="hotel"?"X-GTH-Page-Size":"X-Page-Size");
 const validTotal=headerTotal!==null&&/^\d{1,9}$/.test(headerTotal);
 const total=validTotal?Number(headerTotal):limit(parent.total)||mapped.total;
 const size=headerSize!==null&&/^\d{1,3}$/.test(headerSize)?Number(headerSize):limit(parent.pageSize);
 const hasNext=kind==="hotel"?result.headers.get("X-GTH-Has-More")==="true":
  typeof parent.hasNext==="boolean"?parent.hasNext:size>0&&page*size<total;
 const loadedAt=new Date().toISOString();
 return {...mapped,items:mapped.items.map(item=>({...item,loadedAt})),total,page,totalIsExact:validTotal||typeof parent.total==="number"&&Number.isInteger(parent.total)&&parent.total>=0,
  hasNext:page<maxPage(kind)&&hasNext};
}
