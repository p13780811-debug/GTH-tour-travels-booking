"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Globe2,ShieldCheck} from "lucide-react";
import NuiteeHotelCard from "@/components/hotel/NuiteeHotelCard";
import {HOTEL_MARKETS,getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";

type Hotel={id:string;name:string;city:string;address:string;photo:string|null;stars:number|null;rating:number|null};
type Feed={market:string;sandbox:boolean;hotels:Hotel[]};
const FEATURED=["mumbai","london"] as const;
function validHotel(value:unknown):value is Hotel{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const h=value as Partial<Hotel>;
 return typeof h.id==="string"&&/^[A-Za-z0-9_-]{2,100}$/.test(h.id)&&
   typeof h.name==="string"&&h.name.length>=4&&typeof h.city==="string"&&
   typeof h.address==="string"&&(h.photo===null||typeof h.photo==="string");
}
function Market({slug}:{slug:string}){
 const market=getHotelMarket(slug);
 const [feed,setFeed]=useState<Feed|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
   const controller=new AbortController();
   setLoading(true);setFeed(null);setError(false);
   fetch("/api/hotels/nuitee-featured?market="+encodeURIComponent(slug),{signal:controller.signal})
     .then(async response=>{if(!response.ok)throw new Error("Supplier unavailable");return response.json() as Promise<unknown>;})
     .then(value=>{
       if(controller.signal.aborted)return;
       if(!value||typeof value!=="object"||!Array.isArray((value as Feed).hotels))throw new Error("Invalid response");
       const data=value as Feed;
       setFeed({market:slug,sandbox:data.sandbox===true,hotels:data.hotels.filter(validHotel)});
     }).catch(()=>{if(!controller.signal.aborted)setError(true);})
     .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
   return ()=>controller.abort();
 },[slug,attempt]);
 if(!market)return null;
 return <section aria-label={market.city+" featured hotels"} className="min-w-0">
   <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
     <h3 className="text-xl font-semibold">{market.city}</h3>
     <Link href={"/hotels/explore/"+market.slug} className="text-sm font-semibold underline">Explore area guide</Link>
   </div>
   {loading&&<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">Loading source-backed hotels…</p>}
   {error&&<div role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
     Live supplier catalogue is not available here right now. The existing hotel booking search above is unchanged.
     <button type="button" onClick={()=>setAttempt(n=>n+1)} className="gth-btn ml-3 min-h-10 px-3">Retry</button>
   </div>}
   {!loading&&!error&&feed&&(
     <>
       {feed.sandbox&&<p className="mb-3 text-xs text-[var(--text-soft)]">Sandbox metadata only. No live rates or reservations are represented.</p>}
       {feed.hotels.length?
         <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
           {feed.hotels.slice(0,6).map(hotel=><NuiteeHotelCard key={hotel.id} hotel={hotel} market={slug} sandbox={feed.sandbox}/>)}
         </div>:
         <p className="rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-soft)]">No hotels were returned for this area. Use the existing booking search to explore other locations.</p>
       }
     </>
   )}
 </section>;
}
/** Rendered BELOW the original hotel experience, never replacing search or modifying its CSS. */
export default function NuiteeHotelOffers(){
 return <section aria-labelledby="gth-supplier-hotels" className="mx-auto max-w-7xl px-4 pb-12 pt-8 text-[var(--text)] sm:px-6">
   <div className="mb-6">
     <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--gold)]"><Globe2 size={15}/> GTH PRO hotel discovery</p>
     <h2 id="gth-supplier-hotels" className="mt-2 text-2xl font-bold md:text-3xl">Explore hotels in India and worldwide</h2>
     <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
       Source-backed Nuitee supplier listings appear when the approved catalogue is available. Read location guidance on GTH PRO; select the exact hotel to continue on our existing Nuitee White Label.
     </p>
   </div>
   <div className="grid min-w-0 gap-10">{FEATURED.map(slug=><Market key={slug} slug={slug}/>)}</div>
   <div className="mt-9">
     <h3 className="mb-3 text-lg font-semibold">Explore hotel destinations</h3>
     <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
       {HOTEL_MARKETS.map(m=><Link key={m.slug} href={"/hotels/explore/"+m.slug}
         className="flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold hover:border-[var(--gold)]">
         {m.city}
       </Link>)}
     </div>
   </div>
   <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
     <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0"/>
     Current rates, room types, cancellation policies and payments are shown by the independent hotel booking provider. No unverified room prices are displayed here.
   </p>
 </section>;
}
