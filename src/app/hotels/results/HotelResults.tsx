"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {useHotelIllustrations} from "@/lib/travel/use-hotel-illustrations";
import {hotelProviderSearchUrl} from "@/lib/travel/hotel-provider-search";
import {hotelSearchParams,type HotelSearchScope} from "@/lib/travel/hotel-search-params";
import {ArrowRight,BedDouble,Hotel,MapPin,ShieldCheck} from "lucide-react";
type Stay={id:string|number;name:string;city:string;category?:string;image:string;stars:number|null;
 affiliate_link:string|null;source?:string;source_license?:string;country?:string|null};
export default function HotelResults({city="",destination="",compactRail=false,scope}:{city?:string;destination?:string;compactRail?:boolean;scope?:HotelSearchScope}){
 const effectiveCity=scope?.city||city;
 const effectiveDestination=scope?.destination||destination;
 const effectiveName=scope?.name||"";
 const effectiveCountry=scope?.country||"";
 const effectiveCategory=scope?.category||"";
 const effectiveSort=scope?.sort||"name_asc";
 const effectiveSource=scope?.source||"all";
 const placeLabel=effectiveCity||effectiveDestination.replaceAll("-"," ")||effectiveName||effectiveCountry||"your search";
 const [items,setItems]=useState<Stay[]>([]);
 const illustrations=useHotelIllustrations(effectiveCity,items.some(h=>!h.image||h.image==="/placeholder.jpg"));
 const [loading,setLoading]=useState(true),[loadingMore,setLoadingMore]=useState(false);
 const [error,setError]=useState(""),[page,setPage]=useState(1),[total,setTotal]=useState(0),[more,setMore]=useState(false);
 const query=(n:number)=>"/api/hotels?"+hotelSearchParams({
 city:effectiveCity,destination:effectiveDestination,name:effectiveName,
 country:effectiveCountry,category:effectiveCategory,sort:effectiveSort,source:effectiveSource
 },n);
 useEffect(()=>{
  const controller=new AbortController();
  setItems([]);setLoading(true);setError("");setPage(1);setTotal(0);setMore(false);
  fetch(query(1),{signal:controller.signal,cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error("Hotel catalog unavailable");const v:unknown=await r.json();
   if(!Array.isArray(v))throw Error("Invalid hotel data");
   if(!controller.signal.aborted){setItems(v as Stay[]);setTotal(Number(r.headers.get("X-GTH-Total"))||v.length);
     setMore(r.headers.get("X-GTH-Has-More")==="true");}
  }).catch(()=>{if(!controller.signal.aborted)setError("Hotel listings could not be loaded. Please retry.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[effectiveCity,effectiveDestination,effectiveName,effectiveCountry,effectiveCategory,effectiveSort,effectiveSource]);
 async function loadMore(){
  if(!more||loading||loadingMore)return;setLoadingMore(true);
  try{
   const r=await fetch(query(page+1),{cache:"no-store"});
   if(!r.ok)throw Error("Hotel page unavailable");
   const data:unknown=await r.json();if(!Array.isArray(data))throw Error("Invalid data");
   const next=data as Stay[];
   setItems(old=>{const map=new Map(old.map(x=>[String(x.id),x]));for(const x of next)map.set(String(x.id),x);return [...map.values()];});
   setPage(p=>p+1);setMore(next.length>0&&r.headers.get("X-GTH-Has-More")==="true");setError("");
  }catch{setError("More hotels could not be loaded; retry.");}finally{setLoadingMore(false);}
 }
 if(loading)return <p role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm">Searching hotel listings for {placeLabel}…</p>;
 if(error&&!items.length)return <p role="alert" className="gth-glass rounded-2xl p-6 text-sm">{error}</p>;
 if(!items.length)return <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-7">
  <h3 className="text-lg font-semibold">Hotel records for {placeLabel} are not imported yet</h3>
  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">The destination is connected to our real accommodation catalog, but no matching source-backed records are available yet. This does not mean hotels or rooms are unavailable. New licensed records are synchronized automatically.</p>
  <Link href={"/hotels?"+hotelSearchParams({city:effectiveCity,destination:effectiveDestination,name:effectiveName,country:effectiveCountry,category:effectiveCategory,sort:effectiveSort,source:effectiveSource},1)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">Explore hotel directory <ArrowRight size={16}/></Link>
  <a href={hotelProviderSearchUrl(placeLabel)} target="_blank" rel="noopener noreferrer nofollow"
    className="gth-btn-gold ml-0 mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold sm:ml-3">
    Find live rooms on Booking.com <ArrowRight size={16}/>
  </a>
 </div>;
 return <section aria-label={"Hotels in "+placeLabel} className="space-y-5">
  <p className="text-sm text-[var(--text-soft)]"><strong className="text-[var(--text)]">{total.toLocaleString()}</strong> source-backed accommodation records for {placeLabel} · Prices, stars and room availability unverified</p>
  {illustrations.length>0&&<p className="text-xs leading-5 text-[var(--text-soft)]">Some card photographs illustrate the destination, not the specific hotel. Photos provided by <a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer nofollow" className="underline">Pexels</a>.</p>}
  {compactRail&&<div role="region" aria-label={"Hotels in "+city+" horizontal cards"} tabIndex={0}
    className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
    {items.map((hotel,index)=><Link key={String(hotel.id)} href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))}
      className="group flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-32 shrink-0 overflow-hidden bg-[var(--bg-soft)]">
        <HotelPropertyImage src={hotel.image} name={hotel.name}
          illustration={illustrations.length?illustrations[index%illustrations.length]:null}
          showIllustrationCreditLink={false}
          className="h-full w-full object-cover"
          placeholderClassName="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-[var(--text-soft)]"/>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <p className="text-xs capitalize text-[var(--text-soft)]">{(hotel.category||"hotel").replaceAll("_"," ")}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold">{hotel.name}</h3>
        <p className="mt-1 line-clamp-1 flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13} aria-hidden="true"/>{hotel.city}{hotel.country?", "+hotel.country:""}</p>
        <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">View hotel & source <ArrowRight size={15}/></span>
      </div>
    </Link>)}
  </div>}
  {!compactRail&&  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
   {items.map((hotel,index)=><article key={String(hotel.id)} className="gth-glass flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)]">
    <div className="relative h-44 bg-[var(--bg-soft)]">
     <HotelPropertyImage src={hotel.image} name={hotel.name}
       illustration={illustrations.length?illustrations[index%illustrations.length]:null}
       className="h-full w-full object-cover"
       placeholderClassName="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-soft)]"/>
     {(!hotel.image||hotel.image==="/placeholder.jpg")&&<span className="sr-only">No verified property photo</span>}
     <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold capitalize">{(hotel.category||"hotel").replaceAll("_"," ")}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
     <h3 className="line-clamp-2 text-lg font-semibold">{hotel.name}</h3>
     <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={15}/>{hotel.city}{hotel.country?", "+hotel.country:""}</p>
     <p className="mt-3 text-xs text-[var(--text-soft)]">{hotel.source==="OpenStreetMap"?"© OpenStreetMap contributors · ODbL 1.0 · Source location":"Approved hotel supplier record"}</p>
     <div className="mt-auto space-y-3 pt-5">
      <Link href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">View hotel & source <ArrowRight size={16}/></Link>
      {hotel.affiliate_link?<a href={hotel.affiliate_link} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">Continue to booking partner <ArrowRight size={16}/></a>:
       <div className="space-y-2">
        <a href={hotelProviderSearchUrl([hotel.name,hotel.city,hotel.country].filter(Boolean).join(", "))}
          target="_blank" rel="noopener noreferrer nofollow"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
          Search this hotel on Booking.com <ArrowRight size={16}/>
        </a>
        <p className="flex gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={15} className="mt-1 shrink-0"/>External name search only. Confirm the exact property with the provider.</p>
       </div>}
     </div>
    </div>
   </article>)}
  </div>}
  {more?<button type="button" disabled={loadingMore} onClick={()=>void loadMore()} className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-60">{loadingMore?"Loading…":"Load more hotels (page "+(page+1)+")"} <BedDouble size={16}/></button>:null}
  {error?<p role="alert" className="text-sm text-[var(--text-soft)]">{error}</p>:null}
 </section>;
}
