"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,BedDouble,Hotel,MapPin,ShieldCheck} from "lucide-react";
type Stay={id:string|number;name:string;city:string;category?:string;image:string;stars:number|null;
 affiliate_link:string|null;source?:string;source_license?:string;country?:string|null};
export default function HotelResults({city,destination}:{city:string;destination?:string}){
 const [items,setItems]=useState<Stay[]>([]);
 const [loading,setLoading]=useState(true),[loadingMore,setLoadingMore]=useState(false);
 const [error,setError]=useState(""),[page,setPage]=useState(1),[total,setTotal]=useState(0),[more,setMore]=useState(false);
 const query=(n:number)=>{const p=new URLSearchParams({page:String(n)});
   if(destination)p.set("destination",destination);else p.set("city",city);return "/api/hotels?"+p;};
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
 },[city,destination]);
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
 if(loading)return <p role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm">Searching hotel listings for {city}…</p>;
 if(error&&!items.length)return <p role="alert" className="gth-glass rounded-2xl p-6 text-sm">{error}</p>;
 if(!items.length)return <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-7">
  <h3 className="text-lg font-semibold">Hotel records for {city} are not imported yet</h3>
  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">The destination is connected to our real accommodation catalog, but no matching source-backed records are available yet. This does not mean hotels or rooms are unavailable. New licensed records are synchronized automatically.</p>
  <Link href={"/hotels?city="+encodeURIComponent(city)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">Explore hotel directory <ArrowRight size={16}/></Link>
 </div>;
 return <section aria-label={"Hotels in "+city} className="space-y-5">
  <p className="text-sm text-[var(--text-soft)]"><strong className="text-[var(--text)]">{total.toLocaleString()}</strong> source-backed accommodation records for {city} · Prices, stars and room availability unverified</p>
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
   {items.map(hotel=><article key={String(hotel.id)} className="gth-glass flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)]">
    <div className="relative h-44 bg-[var(--bg-soft)]">
     {hotel.image&&hotel.image!=="/placeholder.jpg"?
       <img src={hotel.image} alt={"Hotel property: "+hotel.name} loading="lazy" className="h-full w-full object-cover"/>:
       <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-soft)]"><Hotel size={30}/><span className="text-xs">No verified property photo</span></div>}
     <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold capitalize">{(hotel.category||"hotel").replaceAll("_"," ")}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
     <h3 className="line-clamp-2 text-lg font-semibold">{hotel.name}</h3>
     <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={15}/>{hotel.city}{hotel.country?", "+hotel.country:""}</p>
     <p className="mt-3 text-xs text-[var(--text-soft)]">{hotel.source==="OpenStreetMap"?"© OpenStreetMap contributors · ODbL 1.0 · Source location":"Approved hotel supplier record"}</p>
     <div className="mt-auto space-y-3 pt-5">
      <Link href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">View hotel & source <ArrowRight size={16}/></Link>
      {hotel.affiliate_link?<a href={hotel.affiliate_link} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">Continue to booking partner <ArrowRight size={16}/></a>:
       <p className="flex gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={15} className="mt-1 shrink-0"/>Partner booking link not available for this listing; official source and hotel website are in details.</p>}
     </div>
    </div>
   </article>)}
  </div>
  {more?<button type="button" disabled={loadingMore} onClick={()=>void loadMore()} className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-60">{loadingMore?"Loading…":"Load more hotels (page "+(page+1)+")"} <BedDouble size={16}/></button>:null}
  {error?<p role="alert" className="text-sm text-[var(--text-soft)]">{error}</p>:null}
 </section>;
}
