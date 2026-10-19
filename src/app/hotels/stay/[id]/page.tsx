import type {Metadata} from "next";
import {cache} from "react";
import JsonLd from "@/components/seo/JsonLd";
import GoogleHotelPhoto from "@/components/hotel/GoogleHotelPhoto";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import HotelStayVisual from "@/components/hotel/HotelStayVisual";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {hotelMetadata,isIndexableHotel} from "@/lib/seo/public-listings";
import {isDescriptiveHotelName} from "@/lib/travel/hotel-name-quality";
import {hotelSourceImageUrl} from "@/lib/travel/hotel-source-image";
import {hotelProviderSearchUrl} from "@/lib/travel/hotel-provider-search";
import {safeVerifiedHotelAffiliateUrl,providerDisplayName,type HotelBookingMapping} from "@/lib/travel/hotel-booking-links";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,ArrowUpRight,MapPin,ShieldCheck,BedDouble,CalendarDays,Globe,Compass,ImageOff} from "lucide-react";

export const dynamic="force-dynamic";
type PageProps={params:Promise<{id:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>};
function firstSearchValue(value:string|string[]|undefined):string{
 return typeof value==="string"?value:Array.isArray(value)?value[0]||"":"";
}
const PARTNER_HOSTS=["booking.com","trip.com","klook.com","tp.media","tpo.lv"];
function safeLink(value:unknown,allowPartner=false):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
  const h=u.hostname.toLowerCase();
  if(allowPartner&&!PARTNER_HOSTS.some(p=>h===p||h.endsWith("."+p)))return null;
  if(!h.includes(".")||h==="localhost"||/^\d+\.\d+\.\d+\.\d+$/.test(h))return null;
  return u.toString();
 }catch{return null;}
}
function safeImage(value:unknown):string|null{
 return hotelSourceImageUrl(value);
}
function safeBusinessPhone(value:unknown):string|null{
 if(typeof value!=="string"||value.length>35)return null;
 const phone=value.trim();
  return /^[+]?[0-9][0-9 ().-]{6,30}$/.test(phone)?phone:null;
}
const getHotel=cache(async(id:string)=>{
 // Next route params are decoded once; accept encoded IDs from legacy card URLs too.
 try { id = decodeURIComponent(id); } catch { return null; }
 if(id.length>95)return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 let hotel:null|{name:string;city:string|null;country:string|null;category:string;source:string;
  address:string|null;description:string|null;phone:string|null;sourceUrl:string|null;website:string|null;partner:string|null;partnerName:string|null;image:string|null;
  lat:number|null;lon:number|null;updated:string|null;
  imageCredit:{author:string;license:string;licenseUrl:string;commonsPage:string}|null}=null;
 if(/^osm:(node|way|relation)-[0-9]{1,19}$/.test(id)){
  const sourceId=id.slice(4).replace("-","/");
  const {data,error}=await db.from("hotel_catalog").select("name,city,country_code,category,address,phone,source_url,website,image_url,latitude,longitude,updated_at")
    .eq("source","osm").eq("source_id",sourceId).maybeSingle();
  if(!error&&data)hotel={name:data.name,city:data.city,country:data.country_code,category:data.category,source:"OpenStreetMap",
   address:data.address,description:null,phone:safeBusinessPhone(data.phone),sourceUrl:safeLink(data.source_url),website:safeLink(data.website),
   image:safeImage(data.image_url),imageCredit:null,partner:null,partnerName:null,lat:data.latitude,lon:data.longitude,updated:data.updated_at};
 }else if(/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)){
  const {data,error}=await db.from("hotels").select("name,city,country_code,address,category,description,image_url,affiliate_link,source_name,source_url")
    .eq("id",id).eq("is_public",true).eq("media_rights_verified",true).not("source_name","is",null).maybeSingle();
  if(!error&&data)hotel={name:data.name,city:data.city,country:data.country_code,category:data.category||"hotel",
   source:data.source_name??"Approved provider",address:data.address,description:data.description,phone:null,
   sourceUrl:safeLink(data.source_url),
   website:data.source_name==="GTH PRO Reviewed Hotel Partner"&&data.source_url&&!data.source_url.includes("/hotels/stay/")
    ?safeLink(data.source_url):null,
   image:safeImage(data.image_url),imageCredit:null,partner:null,partnerName:null,lat:null,lon:null,updated:null};
 }
 if(hotel&&!isDescriptiveHotelName(hotel.name))return null;
 // Booking is a separate exact-property overlay; OSM data and photos remain untouched.
 // A missing migration, empty supplier feed or expired manual verification fails closed.
 if(hotel){
  const sourceId=hotel.source==="OpenStreetMap"?id.slice(4).replace("-","/"):null;
  let query=db.from("hotel_booking_links")
   .select("provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider")
   .eq("active",true).eq("exact_property_verified",true).eq("program_approved",true)
   .gte("verified_at",new Date(Date.now()-180*86400000).toISOString());
  if(sourceId)query=query.eq("catalog_source","osm").eq("catalog_source_id",sourceId);
  else query=query.eq("reviewed_hotel_id",id);
  const {data:options,error:optionsError}=await query.order("verified_at",{ascending:false}).limit(4);
  if(!optionsError&&options)for(const option of options){
   const link=safeVerifiedHotelAffiliateUrl(option as HotelBookingMapping);
   if(link){hotel.partner=link;hotel.partnerName=providerDisplayName(option.provider);break;}
  }
 }

 if(hotel?.source==="OpenStreetMap"&&!hotel.image){
  const {data:photo}=await db.from("hotel_catalog_media")
   .select("image_url,author,license_name,license_url,commons_page")
   .eq("source","osm").eq("source_id",id.slice(4).replace("-","/")).maybeSingle();
  const image=safeImage(photo?.image_url);
  if(photo&&image){
   hotel.image=image;
   hotel.imageCredit={
    author:photo.author,license:photo.license_name,
    licenseUrl:photo.license_url,commonsPage:photo.commons_page,
   };
  }
 }
 return hotel;
});

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {id}=await params;
 return hotelMetadata(await getHotel(id),id,isPublicLaunch());
}

export default async function HotelStay({params,searchParams}:PageProps){
 const {id}=await params;
 const requested=searchParams?await searchParams:{};
 const checkinInput=firstSearchValue(requested.checkin);
 const checkoutInput=firstSearchValue(requested.checkout);
 const checkin=/^\d{4}-\d{2}-\d{2}$/.test(checkinInput)?checkinInput:"";
 const checkout=/^\d{4}-\d{2}-\d{2}$/.test(checkoutInput)?checkoutInput:"";
 const adultString=firstSearchValue(requested.adults);
 const adults=/^(?:[1-9]|1[0-9]|20)$/.test(adultString)?Number(adultString):undefined;
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return <main className="mx-auto max-w-5xl p-8">Hotel directory currently unavailable.</main>;
 const hotel=await getHotel(id);
 if(!hotel)return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-16">
   <h1 className="text-2xl font-semibold">Hotel record not available</h1>
   <p className="mt-4 text-sm text-[var(--text-soft)]">This listing may have changed or is not approved for publication.</p>
   <Link className="mt-5 inline-flex gap-2 underline" href="/hotels"><ArrowLeft size={16}/> Back to hotel search</Link>
 </main>;
 const canonical=siteUrl(`/hotels/stay/${encodeURIComponent(id)}`);
 const gallery:string[]=[];
 if(hotel.source==="GTH PRO Reviewed Hotel Partner"){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(url&&key){
   const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data:photos}=await db.from("hotel_partner_public_photos").select("image_url")
    .eq("hotel_id",id).order("slot",{ascending:true}).limit(6);
   for(const photo of photos||[]){const image=safeImage(photo.image_url);if(image)gallery.push(image);}
  }
 }
 const breadcrumbData={
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  itemListElement:[
   {"@type":"ListItem",position:1,name:"Hotels",item:siteUrl("/hotels")},
   {"@type":"ListItem",position:2,name:hotel.name,item:canonical},
  ],
 };
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  {isPublicLaunch()&&isIndexableHotel(hotel)&&<JsonLd data={breadcrumbData}/>}
  <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
   <Link href="/hotels" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-soft)]">
    <ArrowLeft size={17}/> Hotels & stays</Link>
   <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-9">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO · Source-backed hotel directory</p>
    <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{hotel.name}</h1>
    <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]">
     <MapPin size={16}/> {[hotel.address,hotel.city,hotel.country].filter(Boolean).join(", ")||"Location in source data"}</p>
    <div className="mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
      {hotel.image?<HotelPropertyImage src={hotel.image} name={hotel.name} variant="detail"
       className="h-64 w-full object-cover md:h-96"
       placeholderClassName="flex h-56 flex-col items-center justify-center gap-3 text-[var(--text-soft)]"/>:
       <HotelStayVisual name={hotel.name} location={hotel.city||hotel.country||""}/>}
    </div>
    {hotel.imageCredit&&<p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
      Photo: <a className="underline" href={hotel.imageCredit.commonsPage} target="_blank" rel="noopener noreferrer nofollow">{hotel.imageCredit.author} · Wikimedia Commons</a>
      {" · "}<a className="underline" href={hotel.imageCredit.licenseUrl} target="_blank" rel="noopener noreferrer nofollow">{hotel.imageCredit.license}</a>
    </p>}
    {!hotel.image && hotel.source==="OpenStreetMap" &&
      process.env.GTH_GOOGLE_PLACES_ON_DEMAND_ENABLED==="true" &&
      !!process.env.GOOGLE_PLACES_API_KEY && !!process.env.UPSTASH_REDIS_REST_URL &&
      !!process.env.UPSTASH_REDIS_REST_TOKEN &&
      <GoogleHotelPhoto hotelId={id}/>}
    {gallery.length>1&&<div aria-label="Reviewed hotel photographs" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {gallery.slice(1).map((image,index)=><img key={image} src={image}
       alt={hotel.name+" — reviewed owner photo "+(index+2)} loading="lazy"
       className="h-36 w-full rounded-xl border border-[var(--border)] object-cover"/>)}
    </div>}
    {hotel.description&&<p className="mt-6 text-sm leading-7 text-[var(--text-soft)]">{hotel.description}</p>}
    {hotel.phone&&<p className="mt-3 text-sm text-[var(--text-soft)]">OSM-listed hotel phone (confirm with property):{" "}
      <a className="underline" href={"tel:"+hotel.phone.replace(/[^+0-9]/g,"")}>{hotel.phone}</a>
    </p>}
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
     <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-soft)]">Property type</p><p className="mt-2 font-semibold capitalize">{hotel.category.replaceAll("_"," ")}</p></div>
     <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-soft)]">Directory source</p><p className="mt-2 font-semibold">{hotel.source}</p></div>
     <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-soft)]">Room availability</p><p className="mt-2 font-semibold">Not checked</p></div>
    </div>
    <section className="mt-8 border-t border-[var(--border)] pt-7">
     <h2 className="text-xl font-semibold">Plan and verify your stay</h2>
     <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
      This is a property-location discovery listing, not a confirmed room offer. Check travel dates,
      room type, total taxes, accessibility, cancellation conditions and availability with the property or an authorized booking partner.
      No unverified nightly prices, star ratings or customer reviews are displayed.
      {checkin&&checkout?` Your selected stay is ${checkin} to ${checkout}${adults?` for ${adults} adult${adults>1?"s":""}`:""}. The partner confirms availability and may ask you to confirm dates again.`:""}
     </p>
     <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {[
       ["Check-in / check-out","Choose exact dates when contacting a booking provider"],
       ["Total price and taxes","Ask for the full amount including fees"],
       ["Cancellation and refund","Review the provider's written terms"],
       ["Property details","Confirm amenities and the exact address"],
      ].map(([label,description])=><div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
       <p className="text-sm font-semibold">{label}</p><p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{description}</p>
      </div>)}
     </div>
    </section>
    <div className="mt-7 flex flex-wrap gap-3">
     {hotel.partner&&<a className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
       href={hotel.partner} target="_blank" rel="noopener noreferrer sponsored">
       <BedDouble size={17}/> Book Now{hotel.partnerName?" · "+hotel.partnerName:""} <ArrowUpRight size={16}/></a>}
     {!hotel.partner&&<div role="status" className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-soft)]">
       Exact-property booking is not yet connected for this hotel. You can search by this hotel\u2019s name and location on Booking.com; the provider may show matching results rather than the exact hotel page.
      </div>}
     {!hotel.partner&&(hotel.city||hotel.address||hotel.country)&&<a className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
       href={hotelProviderSearchUrl([hotel.name,hotel.address||hotel.city||hotel.country,hotel.city,hotel.country].filter(Boolean).join(", "),{checkin,checkout,adults})}
       target="_blank" rel="noopener noreferrer nofollow">
       <BedDouble size={17}/> Find this hotel on Booking.com <ArrowUpRight size={16}/></a>}
     {hotel.website&&<a className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
       href={hotel.website} target="_blank" rel="noopener noreferrer nofollow"><Globe size={16}/> Listed hotel website <ArrowUpRight size={15}/></a>}
     {hotel.sourceUrl&&<a className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
       href={hotel.sourceUrl} target="_blank" rel="noopener noreferrer nofollow"><Compass size={16}/> {hotel.source==="OpenStreetMap"?"Original directory record":"Hotel listing source"} <ArrowUpRight size={15}/></a>}
    </div>
    {hotel.lat!==null&&hotel.lon!==null&&<p className="mt-5 text-xs text-[var(--text-soft)]">
     Directory coordinates: {hotel.lat.toFixed(5)}, {hotel.lon.toFixed(5)} (not guaranteed to identify the entrance).
    </p>}
    <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
     <ShieldCheck size={16} className="mt-1 shrink-0"/> The booking provider, not GTH PRO, confirms any booking and handles payments.
     {hotel.source==="OpenStreetMap"?" Data: © OpenStreetMap contributors, ODbL 1.0.":""}
    </p>
   </div>
  </article>
 </main>;
}
