"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,MapPin,ShieldCheck} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";

type Card={id:string;name:string;city:string;country:string;countryCode:string;category:string;
 image:string|null;source:string;bookingReady:boolean;
 imageAttribution:{author:string;license:string;licenseUrl:string;commonsPage:string}|null};
type Feed={india:Card[];international:Card[];ratesVerified:false};
function isCard(input:unknown):input is Card{
 if(!input||typeof input!=="object")return false;
 const h=input as Partial<Card>;
 return typeof h.id==="string"&&typeof h.name==="string"&&typeof h.city==="string"&&
   typeof h.country==="string"&&typeof h.bookingReady==="boolean";
}
function HotelCard({hotel}:{hotel:Card}){
 const href=hotel.bookingReady?"/hotels/partner/"+encodeURIComponent(hotel.id):
   "/hotels/stay/"+encodeURIComponent(hotel.id);
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)]">
   <Link href={href} rel={hotel.bookingReady?"sponsored":undefined} aria-label={"Explore "+hotel.name}
     className="group relative block h-44 overflow-hidden bg-[var(--bg-soft)]">
     <HotelPropertyImage src={hotel.image} name={hotel.name}
       className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
       placeholderClassName="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-soft)]"/>
     {hotel.bookingReady&&<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs font-semibold"><ShieldCheck size={13}/> Verified partner link</span>}
     {hotel.imageAttribution&&<span className="absolute bottom-2 left-2 right-2 rounded bg-[var(--card)] px-2 py-1 text-[10px]">
       Photo: {hotel.imageAttribution.author} · Wikimedia Commons
     </span>}
   </Link>
   <div className="flex min-h-48 flex-1 flex-col gap-2 p-4">
     <p className="text-xs capitalize text-[var(--text-soft)]">{hotel.category.replaceAll("_"," ")} · {hotel.source}</p>
     <h3 className="line-clamp-2 text-base font-semibold">{hotel.name}</h3>
     <p className="flex items-start gap-1.5 text-xs text-[var(--text-soft)]"><MapPin size={14} className="mt-0.5 shrink-0"/><span>{hotel.city} · {hotel.country}</span></p>
     <p className="mt-auto pt-2 text-xs text-[var(--text-soft)]">{hotel.bookingReady?
       "Price and availability on booking partner":"Source-backed hotel · Check room availability"}</p>
     <Link href={href} rel={hotel.bookingReady?"sponsored":undefined}
       className="gth-btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-sm font-semibold">
       {hotel.bookingReady?"Open exact hotel":"View hotel details"} <ArrowUpRight size={15}/>
     </Link>
   </div>
 </article>;
}
export default function HotelFeaturedStays(){
 const [data,setData]=useState<Feed|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[retry,setRetry]=useState(0);
 useEffect(()=>{
   const ctrl=new AbortController();setLoading(true);setError("");
   fetch("/api/hotels/featured",{signal:ctrl.signal}).then(async response=>{
     if(!response.ok)throw new Error("Hotel feed unavailable");
     const body:unknown=await response.json();
     if(!body||typeof body!=="object")throw new Error("Hotel feed invalid");
     const parsed=body as Partial<Feed>;
     if(!Array.isArray(parsed.india)||!Array.isArray(parsed.international))throw new Error("Hotel feed invalid");
     if(!ctrl.signal.aborted)setData({india:parsed.india.filter(isCard),
       international:parsed.international.filter(isCard),ratesVerified:false});
   }).catch(()=>{if(!ctrl.signal.aborted)setError("Featured hotel listings are temporarily unavailable.");})
     .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
   return ()=>ctrl.abort();
 },[retry]);
 const sections=[
   {key:"india",title:"Hotels across India",href:"/hotels?country=IN&view=directory"},
   {key:"international",title:"International hotels",href:"/hotels?view=directory"}
 ] as const;
 return <section aria-labelledby="gth-source-hotels" className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6">
   <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO · Discover real hotels</p>
   <h2 id="gth-source-hotels" className="mt-2 text-2xl font-bold md:text-3xl">Actual hotels in India and worldwide</h2>
   <p className="mb-6 mt-2 max-w-3xl text-sm text-[var(--text-soft)]">
     Source-backed hotel properties, not destination advertisements. A booking partner opens directly only where that exact hotel has a verified affiliate link.
   </p>
   {loading&&<p role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">Loading source-backed hotels…</p>}
   {error&&<p role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">{error}
     <button type="button" className="gth-btn ml-3" onClick={()=>setRetry(v=>v+1)}>Retry</button></p>}
   {!loading&&!error&&sections.map(section=>{
     const items=data?.[section.key]||[];
     return <div className="mb-8" key={section.key}>
       <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
         <h3 className="text-xl font-bold">{section.title}</h3>
         <Link href={section.href} className="gth-btn inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold">Browse hotels <ArrowUpRight size={15}/></Link>
       </div>
       {items.length?<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         {items.map(hotel=><HotelCard key={hotel.id} hotel={hotel}/>)}
       </div>:<p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">
         No source-backed hotel cards available for this section. Search stays above or browse the existing directory.
       </p>}
     </div>;
   })}
   <p className="text-xs leading-6 text-[var(--text-soft)]">
     Property photos are shown only from the hotel's own source or licensed media overlays. Hotel prices and room availability are confirmed by the provider; booking and payment remain outside GTH PRO. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>.
   </p>
 </section>;
}
