"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,MapPin,Star,ShieldCheck} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

/** Original Nuitee hotel content, presented in existing GTH day/night classes.
 * No iframe, copied CSS, hardcoded colors, fabricated prices or client secrets.
 */
const MARKETS=[
 {key:"india",city:"Mumbai",title:"Hotels in India"},
 {key:"world",city:"London",title:"International hotels"},
] as const;
type Hotel={id:string;name:string;city:string;address:string;photo:string|null;stars:number|null;rating:number|null};
type Feed={market:string;city:string;sandbox:boolean;hotels:Hotel[]};
function validHotel(value:unknown):value is Hotel{
 if(!value||typeof value!=="object")return false;
 const h=value as Partial<Hotel>;
 return typeof h.id==="string"&&/^[A-Za-z0-9_-]{2,100}$/.test(h.id)
   &&typeof h.name==="string"&&typeof h.city==="string"
   &&(h.photo===null||typeof h.photo==="string");
}
function hotelUrl(id:string){
 const u=new URL("/hotels/"+encodeURIComponent(id),HOTEL_BOOKING_ORIGIN);
 u.searchParams.set("language","en");u.searchParams.set("currency","INR");return u.toString();
}
function Card({hotel,sandbox}:{hotel:Hotel;sandbox:boolean}){
 const href=hotelUrl(hotel.id);
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm">
   <a href={href} rel="noopener noreferrer sponsored" aria-label={"Explore "+hotel.name}>
     <div className="h-44 overflow-hidden bg-[var(--bg-soft)] sm:h-48">
       <HotelPropertyImage src={hotel.photo} name={hotel.name}
         className="h-full w-full object-cover"
         placeholderClassName="flex h-full w-full items-center justify-center text-[var(--text-soft)]"/>
     </div>
   </a>
   <div className="flex min-h-48 flex-1 flex-col gap-2 p-4">
     <p className="text-xs text-[var(--text-soft)]">Nuitee · {hotel.city}</p>
     <h4 className="line-clamp-2 text-base font-semibold text-[var(--text)]">{hotel.name}</h4>
     <div className="flex min-h-5 flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
       {hotel.stars!==null&&<span className="inline-flex items-center gap-1">
         <Star size={14} className="text-[var(--gold)]" aria-hidden="true"/>{hotel.stars.toFixed(1)} hotel stars
       </span>}
       {hotel.rating!==null&&<span>Guest rating {hotel.rating.toFixed(1)}/10</span>}
     </div>
     {hotel.address&&<p className="line-clamp-2 flex items-start gap-1.5 text-xs leading-5 text-[var(--text-soft)]">
       <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true"/>{hotel.address}
     </p>}
     <p className="mt-auto pt-2 text-xs text-[var(--text-soft)]">
       {sandbox?"Sandbox hotel · test prices only":"Confirm current prices with supplier"}
     </p>
     <a href={href} rel="noopener noreferrer sponsored"
       className="gth-btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold">
       {sandbox?"Preview hotel details":"See hotel & rooms"} <ArrowUpRight size={15} aria-hidden="true"/>
     </a>
   </div>
 </article>;
}
function Market({market}:{market:typeof MARKETS[number]}){
 const [feed,setFeed]=useState<Feed|null>(null),[error,setError]=useState("");
 const [loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");setFeed(null);
  fetch("/api/hotels/nuitee-featured?market="+market.key,{signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error("Supplier listing unavailable");
    const body:unknown=await response.json();
    if(!body||typeof body!=="object")throw Error("Invalid supplier listing");
    const data=body as Partial<Feed>;
    if(!Array.isArray(data.hotels)||typeof data.sandbox!=="boolean")throw Error("Invalid supplier listing");
    if(!controller.signal.aborted)setFeed({market:market.key,city:market.city,
       sandbox:data.sandbox,hotels:data.hotels.filter(validHotel)});
   }).catch(()=>{if(!controller.signal.aborted)setError("Original supplier hotel cards could not load.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[market.key,retry]);
 return <section aria-label={market.title} className="min-w-0">
   <h3 className="text-xl font-bold text-[var(--text)]">{market.title}</h3>
   <p className="mb-4 mt-1 text-sm text-[var(--text-soft)]">{market.city} · Original Nuitee hotel catalogue</p>
   {loading&&<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">Loading supplier hotels…</p>}
   {error&&<div role="alert" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">
      {error} Existing booking search above is still available.
      <button type="button" onClick={()=>setRetry(v=>v+1)} className="gth-btn mt-3">Retry</button>
   </div>}
   {!loading&&!error&&feed&&<>
    {feed.sandbox&&<p role="note" className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-xs text-[var(--text-soft)]">
      Sandbox preview: test hotel content only, no real transactions or verified live rates.
    </p>}
    {feed.hotels.length?<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {feed.hotels.map(hotel=><Card key={hotel.id} hotel={hotel} sandbox={feed.sandbox}/>)}
    </div>:<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
      No supplier hotels returned for this destination.
    </p>}
   </>}
 </section>;
}
export default function NuiteeHotelOffers(){
 return <section aria-labelledby="gth-nuitee-cards" className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
  <div className="mb-6">
   <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO · Nuitee supplier catalogue</p>
   <h2 id="gth-nuitee-cards" className="mt-2 text-2xl font-bold text-[var(--text)] md:text-3xl">
     Explore original hotels in India and worldwide
   </h2>
   <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
     Supplier hotel names and photos, presented with the existing GTH PRO day/night design.
     Prices and final availability must be checked with Nuitee.
   </p>
  </div>
  <div className="grid min-w-0 gap-8">{MARKETS.map(market=><Market market={market} key={market.key}/>)}</div>
  <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
   <ShieldCheck size={15} className="mt-1 shrink-0" aria-hidden="true"/>
   Preview data does not prove live booking approval.
   <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>.
  </p>
 </section>;
}
