import type {Metadata} from "next";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,ArrowUpRight,MapPin,ShieldCheck,BedDouble,CalendarDays,Globe,Compass} from "lucide-react";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Hotel details & source | GTH PRO",robots:{index:false,follow:false}};
type PageProps={params:Promise<{id:string}>};
const PARTNER_HOSTS=["booking.com","trip.com","hotellook.com","klook.com","tp.media","tpo.lv"];
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
export default async function HotelStay({params}:PageProps){
 const {id}=await params;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return <main className="mx-auto max-w-5xl p-8">Hotel directory currently unavailable.</main>;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 let hotel:null|{name:string;city:string|null;country:string|null;category:string;source:string;
  address:string|null;sourceUrl:string|null;website:string|null;partner:string|null;
  lat:number|null;lon:number|null;updated:string|null}=null;
 if(/^osm:(node|way|relation)-[0-9]{1,19}$/.test(id)){
  const sourceId=id.slice(4).replace("-","/");
  const {data,error}=await db.from("hotel_catalog").select("name,city,country_code,category,address,source_url,website,latitude,longitude,updated_at")
    .eq("source","osm").eq("source_id",sourceId).maybeSingle();
  if(!error&&data)hotel={name:data.name,city:data.city,country:data.country_code,category:data.category,source:"OpenStreetMap",
   address:data.address,sourceUrl:data.source_url,website:safeLink(data.website),
   partner:null,lat:data.latitude,lon:data.longitude,updated:data.updated_at};
 }else if(/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)){
  const {data,error}=await db.from("hotels").select("name,city,affiliate_link,source_name,source_url")
    .eq("id",id).eq("is_public",true).eq("media_rights_verified",true).not("source_name","is",null).maybeSingle();
  if(!error&&data)hotel={name:data.name,city:data.city,country:null,category:"hotel",
   source:data.source_name??"Approved provider",address:null,sourceUrl:safeLink(data.source_url),
   website:null,partner:safeLink(data.affiliate_link,true),lat:null,lon:null,updated:null};
 }
 if(!hotel)return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-16">
   <h1 className="text-2xl font-semibold">Hotel record not available</h1>
   <p className="mt-4 text-sm text-[var(--text-soft)]">This listing may have changed or is not approved for publication.</p>
   <Link className="mt-5 inline-flex gap-2 underline" href="/hotels"><ArrowLeft size={16}/> Back to hotel search</Link>
 </main>;
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
   <Link href="/hotels" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-soft)]">
    <ArrowLeft size={17}/> Hotels & stays</Link>
   <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-9">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO · Source-backed hotel directory</p>
    <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{hotel.name}</h1>
    <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]">
     <MapPin size={16}/> {[hotel.address,hotel.city,hotel.country].filter(Boolean).join(", ")||"Location in source data"}</p>
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
       <BedDouble size={17}/> Check price with partner <ArrowUpRight size={16}/></a>}
     {hotel.website&&<a className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
       href={hotel.website} target="_blank" rel="noopener noreferrer nofollow"><Globe size={16}/> Listed hotel website <ArrowUpRight size={15}/></a>}
     {hotel.sourceUrl&&<a className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
       href={hotel.sourceUrl} target="_blank" rel="noopener noreferrer nofollow"><Compass size={16}/> Original directory record <ArrowUpRight size={15}/></a>}
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
