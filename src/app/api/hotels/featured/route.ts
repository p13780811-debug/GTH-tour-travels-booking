import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {hotelSourceImageUrl} from "@/lib/travel/hotel-source-image";
import {isDescriptiveHotelName,NON_PROPERTY_NAME_PATTERN} from "@/lib/travel/hotel-name-quality";
import {safeVerifiedHotelAffiliateUrl,type HotelBookingMapping} from "@/lib/travel/hotel-booking-links";

/** Public, cached discovery ONLY: real source hotels, no invented prices, availability or partner IDs. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OSM=/^(node|way|relation)\/[0-9]{1,19}$/;
const cacheHeaders={"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800","X-Content-Type-Options":"nosniff"};
const errorHeaders={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
type Supplier={id:string;name:string;city:string|null;country_code:string|null;category:string|null;image_url:string|null;source_name:string|null};
type Directory={source_id:string;name:string;city:string|null;region:string|null;category:string|null;country_code:string|null;extract_country_hint:string|null;image_url:string|null};
type Media={source_id:string;image_url:string;author:string;license_name:string;license_url:string;commons_page:string};
type Mapping=HotelBookingMapping&{catalog_source_id:string|null;reviewed_hotel_id:string|null};
type Card={id:string;name:string;city:string;country:string;countryCode:string;category:string;image:string|null;source:string;bookingReady:boolean;imageAttribution:{author:string;license:string;licenseUrl:string;commonsPage:string}|null};
function code(input:unknown){return typeof input==="string"&&/^[A-Z]{2}$/.test(input)?input:"";}
function country(input:string){try{return new Intl.DisplayNames(["en"],{type:"region"}).of(input)||input;}catch{return input;}}
function safeCredit(input:unknown,host:string){
 if(typeof input!=="string"||input.length>1600)return "";
 try{const u=new URL(input);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.hostname===host?u.toString():"";}catch{return "";}
}
function choose(items:Card[],limit=8):Card[]{
 const score=(h:Card)=>(h.bookingReady?100:0)+(h.image?60:0)+(h.source==="Reviewed hotel owner"?10:0);
 const buckets=new Map<string,Card[]>();
 for(const h of [...items].sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name))){
   const group=h.countryCode+":"+h.city.toLowerCase();
   if(!buckets.has(group))buckets.set(group,[]);
   buckets.get(group)!.push(h);
 }
 const selected:Card[]=[];
 while(selected.length<limit&&[...buckets.values()].some(arr=>arr.length)){
   for(const arr of buckets.values()){const next=arr.shift();if(next)selected.push(next);if(selected.length===limit)break;}
 }
 return selected;
}
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Hotel source unavailable"},{status:503,headers:errorHeaders});
 try{
   // Use existing anon-RLS tables; no paid API, service-role key or payment flow.
   const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const published=()=>db.from("hotels").select("id,name,city,country_code,category,image_url,source_name")
     .eq("is_public",true).eq("media_rights_verified",true).not("source_name","is",null);
   const directory=()=>db.from("hotel_catalog").select("source_id,name,city,region,category,country_code,extract_country_hint,image_url")
     .eq("source","osm").not("name","imatch",NON_PROPERTY_NAME_PATTERN);
   const [indiaSupplier,worldSupplier,indiaDirectory,worldDirectory]=await Promise.all([
     published().eq("country_code","IN").order("name").limit(48),
     published().neq("country_code","IN").not("country_code","is",null).order("name").limit(72),
     directory().or("country_code.eq.IN,extract_country_hint.eq.IN").order("name").limit(96),
     directory().or("country_code.neq.IN,extract_country_hint.neq.IN").order("name").limit(144),
   ]);
   if([indiaSupplier,worldSupplier,indiaDirectory,worldDirectory].every(result=>result.error))
     return NextResponse.json({error:"Hotel source unavailable"},{status:503,headers:errorHeaders});
   const supplierRows=[...(indiaSupplier.data||[]),...(worldSupplier.data||[])] as Supplier[];
   const directoryRows=[...(indiaDirectory.data||[]),...(worldDirectory.data||[])] as Directory[];
   const sourceIds=directoryRows.map(r=>r.source_id).filter(id=>OSM.test(id));
   const supplierIds=supplierRows.map(r=>String(r.id)).filter(id=>UUID.test(id));
   const withoutImages=directoryRows.filter(r=>OSM.test(r.source_id)&&!hotelSourceImageUrl(r.image_url))
     .map(r=>r.source_id).slice(0,120);
   const verifiedTime=new Date(Date.now()-180*86400000).toISOString();
   const links=()=>db.from("hotel_booking_links")
     .select("catalog_source_id,reviewed_hotel_id,provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider")
     .eq("active",true).eq("exact_property_verified",true).eq("program_approved",true)
     .gte("verified_at",verifiedTime);
   const [licensed,osmLinks,ownedLinks]=await Promise.all([
     withoutImages.length?db.from("hotel_catalog_media")
       .select("source_id,image_url,author,license_name,license_url,commons_page")
       .eq("source","osm").in("source_id",withoutImages).limit(120):Promise.resolve({data:[] as Media[]}),
     sourceIds.length?links().eq("catalog_source","osm").in("catalog_source_id",sourceIds.slice(0,240)).limit(240)
       :Promise.resolve({data:[] as Mapping[]}),
     supplierIds.length?links().in("reviewed_hotel_id",supplierIds).limit(160)
       :Promise.resolve({data:[] as Mapping[]}),
   ]);
   const images=new Map<string,Media>();
   for(const row of licensed.data||[])images.set(row.source_id,row as Media);
   const ready=new Set<string>();
   for(const row of (osmLinks.data||[]) as Mapping[])
     if(row.catalog_source_id&&safeVerifiedHotelAffiliateUrl(row))ready.add("osm:"+row.catalog_source_id.replace("/","-"));
   for(const row of (ownedLinks.data||[]) as Mapping[])
     if(row.reviewed_hotel_id&&safeVerifiedHotelAffiliateUrl(row))ready.add(row.reviewed_hotel_id);
   const supplierCards:Card[]=supplierRows.flatMap(row=>{
     const id=String(row.id),region=code(row.country_code);
     if(!UUID.test(id)||!region||!isDescriptiveHotelName(row.name))return [];
     return [{id,name:row.name.trim(),city:row.city?.trim()||"City not specified",
       country:country(region),countryCode:region,category:row.category||"hotel",
       image:hotelSourceImageUrl(row.image_url),source:row.source_name==="GTH PRO Reviewed Hotel Partner"?"Reviewed hotel owner":"Published supplier listing",
       bookingReady:ready.has(id),imageAttribution:null}];
   });
   const directoryCards:Card[]=directoryRows.flatMap(row=>{
     const region=code(row.country_code)||code(row.extract_country_hint);
     if(!OSM.test(row.source_id)||!region||!isDescriptiveHotelName(row.name))return [];
     const id="osm:"+row.source_id.replace("/","-"),credit=images.get(row.source_id);
     const original=hotelSourceImageUrl(row.image_url),extra=original?null:hotelSourceImageUrl(credit?.image_url);
     const commonsPage=safeCredit(credit?.commons_page,"commons.wikimedia.org");
     const licenseUrl=safeCredit(credit?.license_url,"creativecommons.org");
     return [{id,name:row.name.trim(),city:row.city?.trim()||row.region?.trim()||"City not specified",
       country:country(region),countryCode:region,category:row.category||"hotel",image:original||extra,
       source:"OpenStreetMap",bookingReady:ready.has(id),
       imageAttribution:extra&&credit&&commonsPage&&licenseUrl?
         {author:credit.author,license:credit.license_name,licenseUrl,commonsPage}:null}];
   });
   const all=[...supplierCards,...directoryCards];
   return NextResponse.json({india:choose(all.filter(h=>h.countryCode==="IN")),
     international:choose(all.filter(h=>h.countryCode!=="IN")),ratesVerified:false},{headers:cacheHeaders});
 }catch{return NextResponse.json({error:"Hotel source unavailable"},{status:503,headers:errorHeaders});}
}
