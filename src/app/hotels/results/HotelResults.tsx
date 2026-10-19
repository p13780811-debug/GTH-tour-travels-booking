"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {HOTEL_TYPES} from "@/components/hotel/HotelCatalogPulse";
import {hotelSearchParams,validatedHotelStay,type HotelSearchScope} from "@/lib/travel/hotel-search-params";
import {ArrowRight,BedDouble,Hotel,MapPin} from "lucide-react";
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
 const stay=validatedHotelStay(scope?.checkin,scope?.checkout,scope?.adults);
 const staySuffix=stay?"?"+new URLSearchParams({checkin:stay.checkin,checkout:stay.checkout,...(stay.adults?{adults:String(stay.adults)}:{})}).toString():"";
 const filterHref=(overrides:Partial<HotelSearchScope>)=>"/hotels/results?"+hotelSearchParams({
  city:effectiveCity,destination:effectiveDestination,name:effectiveName,country:effectiveCountry,
  category:effectiveCategory,sort:effectiveSort,source:effectiveSource,
  checkin:scope?.checkin,checkout:scope?.checkout,adults:scope?.adults,...overrides
 },1).toString();
 const [items,setItems]=useState<Stay[]>([]);
 const [retryCount,setRetryCount]=useState(0);
 const requestKey=JSON.stringify([effectiveCity,effectiveDestination,effectiveName,effectiveCountry,effectiveCategory,effectiveSort,effectiveSource]);
 const activeKey=useRef(requestKey);
 activeKey.current=requestKey;
 const [loading,setLoading]=useState(true),[loadingMore,setLoadingMore]=useState(false);
 const [error,setError]=useState(""),[page,setPage]=useState(1),[total,setTotal]=useState(0),[more,setMore]=useState(false);
 const query=(n:number)=>"/api/hotels?"+hotelSearchParams({
 city:effectiveCity,destination:effectiveDestination,name:effectiveName,
 country:effectiveCountry,category:effectiveCategory,sort:effectiveSort,source:effectiveSource
 },n);
 useEffect(()=>{
  const controller=new AbortController();
  setItems([]);setLoading(true);setLoadingMore(false);setError("");setPage(1);setTotal(0);setMore(false);
  fetch(query(1),{signal:controller.signal,cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error("Hotel catalog unavailable");const v:unknown=await r.json();
   if(!Array.isArray(v))throw Error("Invalid hotel data");
   if(!controller.signal.aborted){setItems(v as Stay[]);setTotal(Number(r.headers.get("X-GTH-Total"))||v.length);
     setMore(r.headers.get("X-GTH-Has-More")==="true");}
  }).catch(()=>{if(!controller.signal.aborted)setError("Hotel listings could not be loaded. Please retry.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[effectiveCity,effectiveDestination,effectiveName,effectiveCountry,effectiveCategory,effectiveSort,effectiveSource,retryCount]);
 async function loadMore(){
  if(!more||loading||loadingMore)return;
  const startedFor=requestKey;
  setLoadingMore(true);
  try{
   const r=await fetch(query(page+1),{cache:"no-store"});
   if(!r.ok)throw Error("Hotel page unavailable");
   const data:unknown=await r.json();if(!Array.isArray(data))throw Error("Invalid data");
   if(activeKey.current!==startedFor)return;
   const next=data as Stay[];
   setItems(old=>{const map=new Map(old.map(x=>[String(x.id),x]));for(const x of next)map.set(String(x.id),x);return [...map.values()];});
   setPage(p=>p+1);setMore(next.length>0&&r.headers.get("X-GTH-Has-More")==="true");setError("");
  }catch{if(activeKey.current===startedFor)setError("More hotels could not be loaded; retry.");}
  finally{if(activeKey.current===startedFor)setLoadingMore(false);}
 }
 if(loading)return <p role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm">Searching hotel listings for {placeLabel}…</p>;
 if(error&&!items.length)return <div role="alert" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm">
  <p>{error}</p>
  <button type="button" onClick={()=>setRetryCount(n=>n+1)}
   className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 font-semibold">
   Retry hotel listings
  </button>
 </div>;
 if(!items.length)return <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-7">
  <h3 className="text-lg font-semibold">Hotel records for {placeLabel} are not imported yet</h3>
  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">The destination is connected to our real accommodation catalog, but no matching source-backed records are available yet. This does not mean hotels or rooms are unavailable. New licensed records are synchronized automatically.</p>
  <Link href={"/hotels?"+hotelSearchParams({city:effectiveCity,destination:effectiveDestination,name:effectiveName,country:effectiveCountry,category:effectiveCategory,sort:effectiveSort,source:effectiveSource},1)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">Explore hotel directory <ArrowRight size={16}/></Link>
 </div>;
 return <section aria-label={"Hotels in "+placeLabel} className="space-y-5">
  <p className="text-sm text-[var(--text-soft)]"><strong className="text-[var(--text)]">{total.toLocaleString()}</strong> source-backed accommodation records for {placeLabel} · Prices, stars and room availability unverified</p>
  
  {compactRail&&<div role="region" aria-label={"Hotels in "+city+" horizontal cards"} tabIndex={0}
    className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
    {items.map((hotel)=><Link key={String(hotel.id)} href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))+staySuffix}
      className="group flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-32 shrink-0 overflow-hidden bg-[var(--bg-soft)]">
        <HotelPropertyImage src={hotel.image} name={hotel.name}
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

  {!compactRail&&<nav aria-label="Mobile accommodation categories" className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
    {HOTEL_TYPES.map(type=><Link key={type.id} href={filterHref({category:type.id})}
      aria-current={effectiveCategory===type.id?"page":undefined}
      className={"shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold "+(effectiveCategory===type.id?"border-[var(--gold)] bg-[var(--card)]":"border-[var(--border)] bg-[var(--bg)]")}>
      {type.name}
    </Link>)}
  </nav>}
  {!compactRail&&<div className="grid min-w-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside aria-label="Hotel result filters" className="hidden lg:block">
      <div className="sticky top-24 space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <h3 className="text-sm font-bold">Accommodation categories</h3>
          <nav aria-label="Filter hotel type" className="mt-3 flex flex-col gap-1">
            {HOTEL_TYPES.map(type=><Link key={type.id} href={filterHref({category:type.id})}
              aria-current={effectiveCategory===type.id?"page":undefined}
              className={"rounded-lg border px-3 py-2.5 text-sm "+(effectiveCategory===type.id?"border-[var(--gold)] font-bold":"border-transparent hover:border-[var(--border)]")}>
              {type.name}
            </Link>)}
          </nav>
        </div>
        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-bold">Listing source</h3>
          <nav aria-label="Filter listing source" className="mt-3 flex flex-col gap-1">
            {([["all","All listings"],["partner","Approved partners"],["directory","OSM directory"]] as const).map(([value,label])=>
              <Link key={value} href={filterHref({source:value})}
                aria-current={effectiveSource===value?"page":undefined}
                className={"rounded-lg border px-3 py-2 text-sm "+(effectiveSource===value?"border-[var(--gold)] font-bold":"border-transparent hover:border-[var(--border)]")}>{label}</Link>)}
          </nav>
        </div>
        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-bold">Sort results</h3>
          <nav aria-label="Sort hotel names" className="mt-3 flex flex-col gap-1">
            {([["name_asc","Hotel name A–Z"],["name_desc","Hotel name Z–A"]] as const).map(([value,label])=>
              <Link key={value} href={filterHref({sort:value})}
                aria-current={effectiveSort===value?"page":undefined}
                className={"rounded-lg border px-3 py-2 text-sm "+(effectiveSort===value?"border-[var(--gold)] font-bold":"border-transparent hover:border-[var(--border)]")}>{label}</Link>)}
          </nav>
        </div>
        <p className="text-xs leading-5 text-[var(--text-soft)]">Prices, reviews and room availability are not independently verified.</p>
      </div>
    </aside>
    <div className="flex min-w-0 flex-col gap-4">
   {items.map((hotel)=><article key={String(hotel.id)} className="gth-glass flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] md:flex-row">
    <div className="relative h-44 shrink-0 bg-[var(--bg-soft)] md:h-auto md:w-56 lg:w-60">
     <HotelPropertyImage src={hotel.image} name={hotel.name}
       className="h-full min-h-44 w-full object-cover md:min-h-48"
       placeholderClassName="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 text-[var(--text-soft)] md:min-h-48"/>
     {(!hotel.image||hotel.image==="/placeholder.jpg")&&<span className="sr-only">No verified property photo</span>}
     <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold capitalize">{(hotel.category||"hotel").replaceAll("_"," ")}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
     <h3 className="line-clamp-2 text-lg font-semibold md:text-xl">{hotel.name}</h3>
     <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--text-soft)]"><MapPin size={15}/>{hotel.city}{hotel.country?", "+hotel.country:""}</p>
     <p className="mt-3 text-xs text-[var(--text-soft)]">{hotel.source==="OpenStreetMap"?"© OpenStreetMap contributors · ODbL 1.0 · Source location":"Approved hotel supplier record"}</p>
     <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row md:flex-col xl:flex-row">
      <Link href={"/hotels/stay/"+encodeURIComponent(String(hotel.id))+staySuffix} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">View hotel & source <ArrowRight size={16}/></Link>
      <p className="flex-1 self-center text-xs text-[var(--text-soft)]">{hotel.affiliate_link ? "Booking options inside hotel details" : "No direct partner booking link yet"}</p>
     </div>
    </div>
   </article>)}
    </div>
  </div>}
  {more?<button type="button" disabled={loadingMore} onClick={()=>void loadMore()} className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-60">{loadingMore?"Loading…":"Load more hotels (page "+(page+1)+")"} <BedDouble size={16}/></button>:null}
  {error?<p role="alert" className="text-sm text-[var(--text-soft)]">{error}</p>:null}
 </section>;
}
