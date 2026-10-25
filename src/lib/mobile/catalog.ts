import "server-only";
import {createClient} from "@supabase/supabase-js";
import {destinations} from "@/data/destinations";
import type {MobileDiscoveryItem} from "./discovery";
import {mobileAppHref,type MobileSection} from "./routes";
import {safeTenderSource} from "@/lib/tender/catalog";

export type AppListing={
  items:MobileDiscoveryItem[];total:number;page:number;size:number;error:string|null;
};
export type AppQuery={q:string;country:string;category:string;page:number;destination:string};
export const HOTEL_CATEGORIES=[
 {id:"",name:"All stays"},{id:"hotel",name:"Hotels"},{id:"guest_house",name:"Guest houses"},
 {id:"hostel",name:"Hostels"},{id:"motel",name:"Motels"},{id:"apartment",name:"Apartments"},
 {id:"resort",name:"Resorts"}
] as const;
export const TENDER_CATEGORIES=[
 {id:"",name:"All sectors"},{id:"works",name:"Construction"},
 {id:"goods",name:"Goods"},{id:"services",name:"Services"},
 {id:"consultancy",name:"Consulting"},{id:"other",name:"Other"}
] as const;
export const PROPERTY_CATEGORIES=[
 {id:"",name:"All types"},{id:"Apartment",name:"Apartments"},
 {id:"Villa",name:"Villas"},{id:"Commercial",name:"Commercial"},
 {id:"Plot",name:"Plots"}
] as const;
function publicDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const small=(value:unknown,max=90):string=>typeof value==="string"?value.trim().slice(0,max):"";
const localImage=(value:unknown):string|null=>
  typeof value==="string"&&/^\/images\/[a-zA-Z0-9/_-]+\.(?:png|jpg|jpeg|webp)$/.test(value)?value:null;
const iconName=(value:string)=>value.replaceAll("_"," ");
const PAGE_SIZE=24;
const empty=(page:number,message:string):AppListing=>({items:[],total:0,page,size:PAGE_SIZE,error:message});
export function normalizeAppQuery(query:Record<string,string|string[]|undefined>):AppQuery{
 const val=(key:string)=>typeof query[key]==="string"?query[key] as string:"";
 const q=val("q").trim().replace(/[\u0000-\u001f]/g,"").slice(0,70);
 const country=val("country").trim().toUpperCase();
 const category=val("category").trim().slice(0,32);
 const destination=val("destination").trim();
 const p=val("page")||"1";
 return {q,country:/^[A-Z]{2}$/.test(country)?country:"",
  category:/^[a-zA-Z_]{0,32}$/.test(category)?category:"",
  destination:/^[a-z]+(?:-[a-z]+)*$/.test(destination)?destination:"",page:/^[1-9]\d{0,2}$/.test(p)?Math.min(100,Number(p)):1};
}
export function appQueryHref(section:MobileSection,query:AppQuery,overrides:Partial<AppQuery>={}):string{
 const all={...query,...overrides},params=new URLSearchParams();
 if(section==="hotels")params.set("directory","1");
 if(all.q)params.set("q",all.q);
 if(all.country)params.set("country",all.country);
 if(all.category)params.set("category",all.category);
 if(all.destination)params.set("destination",all.destination);
 if(all.page>1)params.set("page",String(all.page));
 const text=params.toString();
 return "/app/"+section+(text?"?"+text:"");
}
function escapeLike(value:string):string{
 return value.replace(/[\\%_]/g,character=>"\\"+character);
}
export async function listAppRecords(section:MobileSection,query:AppQuery):Promise<AppListing>{
 const {page,q,country,category,destination}=query,offset=(page-1)*PAGE_SIZE;
 if(section==="flights"||section==="destinations"){
  let all=destinations.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase()));
  if(destination)all=all.filter(x=>x.slug===destination);
  const items=all.slice(offset,offset+PAGE_SIZE).map((d):MobileDiscoveryItem=>({
    id:d.slug,title:d.name,subtitle:"Travel destination",detail:"City guide & stays",
    href:mobileAppHref("/destinations/"+d.slug),image:localImage(d.image_url)
  }));
  return {items,total:all.length,page,size:PAGE_SIZE,error:null};
 }
 const db=publicDb();if(!db)return empty(page,"Service temporarily unavailable");
 try{
  if(section==="hotels"){
   if(category&&!HOTEL_CATEGORIES.some(c=>c.id===category))return empty(page,"Invalid category");
   const select="source_id,name,city,region,category,country_code,extract_country_hint";
   let list=db.from("hotel_catalog").select(select,{count:"exact"});
   if(category)list=list.eq("category",category);
   if(country)list=list.or("country_code.eq."+country+",extract_country_hint.eq."+country);
   if(q)list=list.ilike("name","%"+escapeLike(q)+"%");
   if(destination){
    const match=destinations.find(d=>d.slug===destination);
    if(!match)return empty(page,"Destination not found");
    const hint=escapeLike(match.name);
    list=list.or("city.ilike."+hint+",region.ilike."+hint);
   }
   const {data,error,count}=await list.order("name",{ascending:true}).order("source_id",{ascending:true})
     .range(offset,offset+PAGE_SIZE-1);
   if(error)return empty(page,"Hotel directory temporarily unavailable");
   const items=(data??[]).flatMap((row):MobileDiscoveryItem[]=>{
     if(!/^(node|way|relation)\/[0-9]{1,19}$/.test(row.source_id))return [];
     return [{id:row.source_id,title:small(row.name,110),
       subtitle:iconName(row.category||"hotel"),detail:small(row.city||row.region||row.extract_country_hint||"Location not stated"),
       href:"/app/hotels/osm:"+row.source_id.replace("/","-"),image:null}];
   });
   return {items,total:count??items.length,page,size:PAGE_SIZE,error:null};
  }
  if(section==="property"){
   if(category&&!PROPERTY_CATEGORIES.some(c=>c.id===category))return empty(page,"Invalid property category");
   let list=db.from("properties").select("slug,title,city,location,property_type,image",{count:"exact"})
     .not("slug","is",null);
   if(q)list=list.ilike("title","%"+escapeLike(q)+"%");
   if(category)list=list.eq("property_type",category);
   const {data,error,count}=await list.order("id",{ascending:false}).range(offset,offset+PAGE_SIZE-1);
   if(error)return empty(page,"Property directory temporarily unavailable");
   const items=(data??[]).flatMap((row):MobileDiscoveryItem[]=>{
     if(typeof row.slug!=="string"||!/^[a-z0-9][a-z0-9-]{1,127}$/.test(row.slug))return [];
     return [{id:row.slug,title:small(row.title,110),
       subtitle:small(row.property_type)||"Property",detail:small(row.city||row.location)||"Location on record",
       href:"/app/property/"+row.slug,image:localImage(row.image)}];
   });
   return {items,total:count??items.length,page,size:PAGE_SIZE,error:null};
  }
  if(category&&!TENDER_CATEGORIES.some(c=>c.id===category))return empty(page,"Invalid procurement sector");
  let list=db.from("tenders").select("id,title,buyer,country_code,sector,deadline_at",{count:"exact"})
    .eq("status","published").eq("is_public",true).eq("source_verified",true)
    .gt("deadline_at",new Date().toISOString());
  if(q)list=list.ilike("title","%"+escapeLike(q)+"%");
  if(country)list=list.eq("country_code",country);
  if(category)list=list.eq("sector",category);
  const {data,error,count}=await list.order("deadline_at",{ascending:true}).range(offset,offset+PAGE_SIZE-1);
  if(error)return empty(page,"Tender listings temporarily unavailable");
  const items=(data??[]).flatMap((row):MobileDiscoveryItem[]=>{
    if(typeof row.id!=="string"||!/^[a-f0-9-]{36}$/i.test(row.id))return [];
    const deadline=new Date(row.deadline_at);
    return [{id:row.id,title:small(row.title,110),
      subtitle:(small(row.country_code,2)+" · "+iconName(row.sector||"Tender")).trim(),
      detail:Number.isFinite(deadline.getTime())?"Deadline "+deadline.toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}):"Review notice",
      href:"/app/tenders/"+row.id,image:null}];
  });
  return {items,total:count??items.length,page,size:PAGE_SIZE,error:null};
 }catch{return empty(page,"Source records could not be loaded");}
}
export type AppDetail={
 title:string;subtitle:string;summary:string;kind:"destination"|"hotel"|"property"|"tender";
 image:string|null;facts:Array<[string,string]>;source:string|null;
 website:string|null;fullSite:string;related:string;
};
function safeSite(v:unknown):string|null{
 if(typeof v!=="string"||v.length>2000)return null;
 try{const u=new URL(v);if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes(".")||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname))return null;return u.toString()}
 catch{return null;}
}
export async function loadAppDetail(section:MobileSection,id:string):Promise<AppDetail|null>{
 if(section==="destinations"){
  const dest=destinations.find(d=>d.slug===id);
  return dest?{title:dest.name,subtitle:"Destination guide",summary:dest.description,
   kind:"destination",image:localImage(dest.image_url),facts:[["Destination",dest.name]],
   source:null,website:null,fullSite:"/destinations/"+id,related:"/app/hotels?destination="+id}:null;
 }
 const db=publicDb();if(!db)return null;
 try{
  if(section==="hotels"){
   if(!/^osm:(node|way|relation)-[0-9]{1,19}$/.test(id))return null;
   const sourceId=id.slice(4).replace("-","/");
   const {data,error}=await db.from("hotel_catalog")
     .select("name,city,region,category,source_url,website,address,country_code,extract_country_hint")
     .eq("source","osm").eq("source_id",sourceId).maybeSingle();
   if(error||!data)return null;
   return {title:small(data.name,160),subtitle:iconName(data.category),
     summary:"This is a source-backed accommodation location. Rates, availability, star rating and booking confirmation have not been verified.",
     kind:"hotel",image:null,
     facts:[["Location",small(data.city||data.region||"Not specified")],["Address",small(data.address||"Not available",180)],
       ["Property type",iconName(data.category)],["Country",data.country_code||"Unverified in source"]],
     source:safeSite(data.source_url),website:safeSite(data.website),
     fullSite:"/hotels/stay/"+id,related:"/app/hotels"};
  }
  if(section==="property"){
   if(!/^[a-z0-9][a-z0-9-]{1,127}$/.test(id))return null;
   const {data,error}=await db.from("properties").select("title,city,location,property_type,image,description,price")
     .eq("slug",id).maybeSingle();
   if(error||!data)return null;
   return {title:small(data.title,160),subtitle:small(data.property_type)||"Property record",
     summary:small(data.description,850)||"Review this public property listing and confirm all details with the listing authority.",
     kind:"property",image:localImage(data.image),
     facts:[["City",small(data.city)||"Not specified"],["Location",small(data.location)||"Not specified"],
       ["Type",small(data.property_type)||"Not specified"],["Price",small(data.price)||"Price on request"]],
     source:null,website:null,fullSite:"/real-estate/"+id,related:"/app/property"};
  }
  if(section==="tenders"){
   if(!/^[a-f0-9-]{36}$/i.test(id))return null;
   const {data,error}=await db.from("tenders")
     .select("title,buyer,country_code,sector,summary,deadline_at,source_url,source_name,requirements_verified")
     .eq("id",id).eq("status","published").eq("is_public",true).eq("source_verified",true)
     .gt("deadline_at",new Date().toISOString()).maybeSingle();
   if(error||!data)return null;
   return {title:small(data.title,180),subtitle:"Published procurement notice",
     summary:small(data.summary,900)||"Read the original issuing authority notice for full requirements.",
     kind:"tender",image:null,
     facts:[["Buyer",small(data.buyer,160)],["Country",small(data.country_code,2)],
       ["Sector",small(data.sector)],["Deadline",data.deadline_at?new Date(data.deadline_at).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"})+" UTC":"Not specified"],
       ["Qualification","Verify on authority portal"]],
     source:safeTenderSource(data.source_url),website:null,fullSite:"/tender/"+id,related:"/app/tenders"};
  }
  return null;
 }catch{return null;}
}
