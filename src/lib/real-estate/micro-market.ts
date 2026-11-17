import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { INDIAN_REGIONS, isGlobalCountryCode } from "./global-registry";

export type MicroPlace = {
  countryCode:string; countryName:string; countrySlug:string;
  regionName:string; regionSlug:string; localityName:string; localitySlug:string;
  path:string;
};
export type LocalProject = {
  id:number; slug:string; title:string; rera_id:string|null; city:string|null;
  developer:string|null; district:string|null;taluka:string|null;village:string|null;sourceUrl:string|null;lat:number|null;lng:number|null;
};
export type LocalHotel = {id:string;name:string;city:string|null;address:string|null;lat:number;lng:number;distanceKm:number};
export type LocalOffer = {id:string;projectId:number;propertyTitle:string;slug:string;price:number;currency:string;publishedAt:string};
export type LocalTender = {id:string;title:string;buyer:string;deadline:string;source:string};
export type MicroSnapshot = {
  place:MicroPlace; projects:LocalProject[]; hotels:LocalHotel[]; offers:LocalOffer[];
  tenders:LocalTender[]; anchor:{lat:number;lng:number}|null;
  complete:boolean; indexable:boolean;
};
const COUNTRY_ALIASES:Readonly<Record<string,string>> = {
  india:"IN","united-arab-emirates":"AE",uae:"AE",dubai:"AE",
  "united-kingdom":"GB",uk:"GB","united-states":"US",usa:"US",
  singapore:"SG",france:"FR",germany:"DE",australia:"AU",canada:"CA",
  "saudi-arabia":"SA",qatar:"QA",oman:"OM",malaysia:"MY",
};
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function segmentSlug(value:string):string {
  return value.normalize("NFKC").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function label(value:string):string {
  return value.split("-").map(word=>/^[0-9]+$/.test(word)?word:word[0].toUpperCase()+word.slice(1)).join(" ");
}
export function parseMicroPlace(country:string,region:string,locality:string):MicroPlace|null {
  if([country,region,locality].some(s=>typeof s!=="string"||s.length>80||s.length<2||!slugPattern.test(s)))return null;
  const code=COUNTRY_ALIASES[country]||(country.length===2?country.toUpperCase():"");
  if(!isGlobalCountryCode(code))return null;
  const countryName=new Intl.DisplayNames(["en"],{type:"region"}).of(code);
  if(!countryName||countryName===code)return null;
  let regionName=label(region);
  if(code==="IN"){
    const match=Object.values(INDIAN_REGIONS).find(name=>segmentSlug(name)===region);
    if(!match)return null;
    regionName=match;
  }
  const localityName=label(locality);
  const countrySlug=segmentSlug(countryName);
  const regionSlug=segmentSlug(regionName);
  if(!localityName||localityName.length>80)return null;
  return {countryCode:code,countryName,countrySlug,regionName,regionSlug,
    localityName,localitySlug:locality,path:"/real-estate/"+countrySlug+"/"+regionSlug+"/"+locality};
}
export function distanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}):number {
  const radians=(v:number)=>v*Math.PI/180;
  const dlat=radians(b.lat-a.lat),dlng=radians(b.lng-a.lng);
  const h=Math.sin(dlat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dlng/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function safeRegistryEvidence(value:unknown):string|null {
  if(typeof value!=="string"||value.length>1200)return null;
  try{
    const url=new URL(value);
    if(url.protocol!=="https:"||url.username||url.password||url.port)return null;
    if(![
      "maharera.maharashtra.gov.in","www.maharera.maharashtra.gov.in",
      "maharera.mahaonline.gov.in","www.maharera.mahaonline.gov.in",
      "wbrera.wb.gov.in","rera.wb.gov.in","hira.wb.gov.in",
    ].includes(url.hostname))return null;
    return url.toString();
  }catch{return null}
}
type SourceProject = {
  id:number;slug:string|null;title:string|null;rera_id:string|null;city:string|null;
  developer:string|null;official_source_url:string|null;district:string|null;taluka:string|null;village:string|null;locality:string|null;verified:boolean|null;lat:number|null;lng:number|null;
};
type SourceHotel = {source_id:string|null;name:string|null;city:string|null;address:string|null;latitude:number|null;longitude:number|null};
type SourceOffer = {id:string;project_id:number;price_amount:number|null;currency:string|null;published_at:string|null};
type SourceTender = {id:string;title:string;buyer:string;deadline_at:string;source_name:string};

function publicDb(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
function point(value:{lat:number|null;lng:number|null}):value is {lat:number;lng:number}{
  return typeof value.lat==="number"&&typeof value.lng==="number"&&
    Number.isFinite(value.lat)&&Number.isFinite(value.lng)&&Math.abs(value.lat)<=90&&Math.abs(value.lng)<=180;
}
function projectAnchor(records:LocalProject[]):{lat:number;lng:number}|null{
  const districts=new Set(records.map(p=>segmentSlug(p.district||"")).filter(Boolean));
  // A village name can appear in multiple districts. Without an explicit
  // district path or independently sourced locality anchor, no shared centroid.
  if(districts.size!==1)return null;
  const points=records.filter((p):p is LocalProject & {lat:number;lng:number}=>point(p));
  if(points.length<2)return null;
  const distinct=new Set(points.map(p=>p.lat.toFixed(4)+","+p.lng.toFixed(4)));
  // The recovered 812 rows sometimes copy the same coordinate across unrelated
  // projects. One repeated point is not independent evidence of a 5km hotel area.
  if(distinct.size<2)return null;
  const sortedLat=points.map(p=>p.lat).sort((a,b)=>a-b),sortedLng=points.map(p=>p.lng).sort((a,b)=>a-b);
  const mid=Math.floor(points.length/2);
  const center={lat:sortedLat[mid],lng:sortedLng[mid]};
  // A single erroneous geotag must not invent a neighborhood hotel cluster.
  return points.filter(p=>distanceKm(center,p)<=5).length>=2?center:null;
}
const snapshotCache=unstable_cache(async(country:string,region:string,locality:string)=>{
  const place=parseMicroPlace(country,region,locality);
  if(!place)return null;
  const db=publicDb();
  if(!db)return {place,projects:[],hotels:[],offers:[],tenders:[],anchor:null,complete:false,indexable:false} satisfies MicroSnapshot;
  const [{data:rows,error:projectError},{data:tenderRows,error:tenderError}]=await Promise.all([
    db.from("properties").select("id,slug,title,rera_id,city,developer,official_source_url,district,taluka,village,locality,verified,lat,lng")
      .eq("country",place.countryName).eq("state",place.regionName)
      // Legacy 812 RERA records have a source-recorded village, but a hardcoded "Mumbai" city.
      // Never use their city field or silently expand a village to its district/taluka.
      .or("locality.ilike."+place.localityName+",village.ilike."+place.localityName)
      .in("source_type",["registry","rera"]).neq("status","archived")
      .order("id",{ascending:false}).limit(18).abortSignal(AbortSignal.timeout(5000)),
    db.from("tenders").select("id,title,buyer,deadline_at,source_name")
      .eq("country_code",place.countryCode).eq("region",place.regionName)
      .eq("is_public",true).eq("source_verified",true).eq("status","published")
      .gt("deadline_at",new Date().toISOString()).order("deadline_at",{ascending:true}).limit(5)
      .abortSignal(AbortSignal.timeout(5000)),
  ]);
  const projects:LocalProject[]=projectError?[]:((rows||[]) as SourceProject[])
    .filter(p=>(segmentSlug(p.locality||"")===place.localitySlug||segmentSlug(p.village||"")===place.localitySlug)
      &&p.slug&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&p.title&&p.title.length>=3)
    .map(p=>({id:p.id,slug:p.slug!,title:p.title!,rera_id:p.rera_id,
      city:p.city,developer:p.developer,district:p.district,taluka:p.taluka,village:p.village,
      sourceUrl:safeRegistryEvidence(p.official_source_url),lat:p.lat,lng:p.lng}));
  // Coordinates are only a provisional spatial anchor if two same-locality
  // records independently agree; these are not official geocoding guarantees.
  // The legacy 812 records have no verified official project URLs and sometimes
  // reuse Mumbai-area coordinates across Pune/Nashik. They can appear as records,
  // but must never establish hotel proximity or indexable geo claims until linked
  // to a independently checked official source.
  const anchor=projectAnchor(projects.filter(p=>p.sourceUrl!==null));
  const eligibleIds=projects.map(p=>p.id).filter(Number.isSafeInteger).slice(0,18);
  let offers:LocalOffer[]=[];
  let offerError=false;
  if(eligibleIds.length){
    const {data,error}=await db.from("property_inventory")
      .select("id,project_id,price_amount,currency,published_at")
      .in("project_id",eligibleIds).eq("status","published").eq("verified",true)
      .not("price_amount","is",null).order("published_at",{ascending:false})
      .limit(18).abortSignal(AbortSignal.timeout(5000));
    offerError=Boolean(error);
    if(!error){
      const titles=new Map(projects.map(p=>[p.id,p]));
      offers=((data||[]) as SourceOffer[]).filter(o=>titles.has(o.project_id)&&
        typeof o.price_amount==="number"&&Number.isFinite(o.price_amount)&&o.price_amount>0&&
        typeof o.currency==="string"&&/^[A-Z]{3}$/.test(o.currency)&&o.published_at)
        .map(o=>({id:o.id,projectId:o.project_id,
          propertyTitle:titles.get(o.project_id)!.title,slug:titles.get(o.project_id)!.slug,
          price:o.price_amount!,currency:o.currency!,publishedAt:o.published_at!}));
    }
  }
  let hotels:LocalHotel[]=[];
  let hotelError=false;
  if(anchor){
    const latitudeRange=5/111.32;
    const longitudeRange=5/(111.32*Math.max(.06,Math.cos(anchor.lat*Math.PI/180)));
    const {data,error}=await db.from("hotel_catalog")
      .select("source_id,name,city,address,latitude,longitude")
      .eq("source","osm").gte("latitude",anchor.lat-latitudeRange)
      .lte("latitude",anchor.lat+latitudeRange)
      .gte("longitude",anchor.lng-longitudeRange)
      .lte("longitude",anchor.lng+longitudeRange)
      .order("id",{ascending:true}).limit(160).abortSignal(AbortSignal.timeout(5000));
    hotelError=Boolean(error);
    if(!error)hotels=((data||[]) as SourceHotel[])
      .filter(h=>h.source_id&&/^(node|way|relation)\/[0-9]{1,19}$/.test(h.source_id)&&h.name&&h.name.trim().length>=3)
      .filter(h=>point({lat:h.latitude,lng:h.longitude}))
      .map(h=>({id:"osm:"+h.source_id!.replace("/","-"),name:h.name!.slice(0,125),city:h.city,
        address:typeof h.address==="string"&&h.address.length<=180?h.address:null,
        lat:h.latitude!,lng:h.longitude!,
        distanceKm:distanceKm(anchor,{lat:h.latitude!,lng:h.longitude!})}))
      .filter(h=>h.distanceKm<=5).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,5);
  }
  const tenders:LocalTender[]=tenderError?[]:((tenderRows||[]) as SourceTender[])
    .filter(t=>Date.parse(t.deadline_at)>Date.now())
    .map(t=>({id:t.id,title:t.title,buyer:t.buyer,deadline:t.deadline_at,source:t.source_name}));
  const complete=!projectError&&!tenderError&&!hotelError&&!offerError;
  const indexable=complete&&Boolean(anchor)&&
    (projects.filter(p=>p.sourceUrl!==null&&p.rera_id).length>=3||offers.length>=2);
  return {place,projects,hotels,offers,tenders,anchor,complete,indexable} satisfies MicroSnapshot;
},["gth-zero-cost-micro-location-v1"],{revalidate:21600,tags:["gth-hyperlocal"]});

export async function readMicroSnapshot(country:string,region:string,locality:string):Promise<MicroSnapshot|null>{
  const place=parseMicroPlace(country,region,locality);
  if(!place)return null;
  return snapshotCache(place.countrySlug,place.regionSlug,place.localitySlug);
}

const directoryCache=unstable_cache(async(country:string,region:string)=>{
  const db=publicDb(),place=parseMicroPlace(country,region,"market");
  if(!db||!place)return [] as Array<{name:string;path:string;city:string|null}>;
  const {data,error}=await db.from("properties").select("locality,village,district,taluka,city,slug,official_source_url,source_type")
    .eq("country",place.countryName).eq("state",place.regionName)
    .in("source_type",["registry","rera"])
    .or("locality.not.is.null,village.not.is.null")
    .order("id",{ascending:false}).limit(150).abortSignal(AbortSignal.timeout(5000));
  if(error)return [];
  const found=new Map<string,{name:string;path:string;city:string|null}>();
  for(const r of data||[]){
    const location=typeof r.locality==="string"&&r.locality.trim()?r.locality:r.village;
    if(typeof location!=="string"||location.trim().length<3)continue;
    // Include historical legacy RERA village references but do not imply
    // officially linked or independently verified status when URL is absent.
    if(!safeRegistryEvidence(r.official_source_url)&&r.source_type!=="rera")continue;
    const localitySlug=segmentSlug(location);
    if(!localitySlug||localitySlug.length>80||!slugPattern.test(localitySlug)||found.has(localitySlug))continue;
    found.set(localitySlug,{name:location.slice(0,80),city:r.district||null,path:"/real-estate/"+place.countrySlug+"/"+place.regionSlug+"/"+localitySlug});
    if(found.size>=30)break;
  }
  return [...found.values()];
},["gth-micro-directory-v1"],{revalidate:21600,tags:["gth-hyperlocal"]});

export function parseMicroRegion(country:string,region:string):MicroPlace|null{
  return parseMicroPlace(country,region,"market");
}
export async function readMicroDirectory(country:string,region:string){
  const p=parseMicroRegion(country,region);
  return p?directoryCache(p.countrySlug,p.regionSlug):[];
}
