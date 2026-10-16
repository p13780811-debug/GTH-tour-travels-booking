import "server-only";
import { createClient } from "@supabase/supabase-js";
import { destinations as curatedDestinations } from "@/data/destinations";

export type MobileDiscoveryKind = "destination" | "hotel" | "property" | "tender";
export type MobileDiscoveryItem = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  href: string;
  image: string | null;
};
export type MobileDiscoveryData = {
  destinations: MobileDiscoveryItem[];
  hotels: MobileDiscoveryItem[];
  properties: MobileDiscoveryItem[];
  tenders: MobileDiscoveryItem[];
};

/** Client-visible source data only; never use service role or secret browser keys. */
function publicClient() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
const text=(value: unknown,max=72)=>typeof value==="string"?value.trim().slice(0,max):"";
const safeImage=(value:unknown):string|null=>{
  if(typeof value!=="string"||value.length>1000)return null;
  // Only trusted local assets for editorial destinations or images already in listing sources.
  if(/^\/images\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp)$/.test(value))return value;
  return null;
};
const appDestinations:MobileDiscoveryItem[]=curatedDestinations.slice(0,12)
  .map((city)=>({id:city.slug,title:city.name,
    subtitle:"Destination guide",detail:"Explore the city",
    image:safeImage(city.image_url),href:"/destinations/"+encodeURIComponent(city.slug)}));

/** Avoid invented ratings, prices, availability, room imagery or registry photographs. */
export async function loadMobileDiscovery():Promise<MobileDiscoveryData>{
  const fallback:MobileDiscoveryData={destinations:appDestinations,hotels:[],properties:[],tenders:[]};
  const db=publicClient();
  if(!db)return fallback;
  const results=await Promise.allSettled([
    db.from("hotel_catalog").select("source_id,name,city,region,category,extract_country_hint")
      .not("city","is",null).order("imported_at",{ascending:false}).limit(14),
    db.from("properties").select("slug,title,city,location,property_type,image")
      .not("slug","is",null).order("id",{ascending:false}).limit(12),
    db.from("tenders").select("id,title,country_code,sector,deadline_at,source_name")
      .eq("status","published").eq("source_verified",true).eq("is_public",true)
      .gt("deadline_at",new Date().toISOString()).order("deadline_at",{ascending:true}).limit(12),
  ]);
  const validData=(index:number):Array<Record<string,unknown>>=>{
    const result=results[index];
    if(result.status!=="fulfilled"||result.value.error||!Array.isArray(result.value.data))return [];
    return result.value.data as Array<Record<string,unknown>>;
  };
  const hotels=validData(0).flatMap((h):MobileDiscoveryItem[]=>{
    const sourceId=text(h.source_id,80);
    const name=text(h.name,95);
    if(!/^(node|way|relation)\/[0-9]{1,19}$/.test(sourceId)||!name)return [];
    const location=text(h.city)||text(h.region)||"Location not specified";
    return [{id:sourceId,href:"/hotels/stay/osm:"+sourceId.replace("/","-"),
      title:name,subtitle:(text(h.category)||"Accommodation").replaceAll("_"," "),
      detail:location,image:null}];
  }).slice(0,10);
  const properties=validData(1).flatMap((p):MobileDiscoveryItem[]=>{
    const slug=text(p.slug,128),name=text(p.title,95);
    if(!/^[a-z0-9][a-z0-9-]{1,127}$/.test(slug)||!name)return [];
    const registry=true;
    return [{id:slug,href:"/real-estate/"+encodeURIComponent(slug),title:name,
      subtitle:registry?"Public registry project":"Property record",
      detail:text(p.city)||text(p.location)||"Location in source",
      // Only use page-specific images when bundled in the app; don't present stock images as property photos.
      image:safeImage(p.image)}];
  }).slice(0,10);
  const tenders=validData(2).flatMap((t):MobileDiscoveryItem[]=>{
    const id=text(t.id,64),name=text(t.title,145);
    if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)||!name)return [];
    const deadline=typeof t.deadline_at==="string"?new Date(t.deadline_at):null;
    const closing=deadline&&Number.isFinite(deadline.getTime())?
      "Closes "+deadline.toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}):"View notice";
    return [{id,href:"/tender/"+encodeURIComponent(id),title:name,
      subtitle:text(t.country_code,2)+" · "+(text(t.sector,32)||"Tender"),detail:closing,image:null}];
  }).slice(0,10);
  return {...fallback,hotels,properties,tenders};
}
