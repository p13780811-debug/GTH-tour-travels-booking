"use client";
import {useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import {MapPin,ArrowUpRight,RotateCcw} from "lucide-react";
import HotelPropertyImage from "./HotelPropertyImage";
import {HOTEL_BOOKING_ORIGIN,hotelWhiteLabelUrl,parseHotelBookingSearch} from "@/lib/travel/hotel-whitelabel";
import {hotelCurrency} from "@/lib/travel/hotel-currency";
import type {HotelProfile} from "@/lib/travel/nuitee-free-hotels";
type Discovery={scope:{country:string;city:string;page:number};countries:{code:string;name:string}[];nearby:HotelProfile[];items:HotelProfile[];hasMore:boolean;available:boolean;partial?:boolean};
export default function NearbyHotelDiscovery({currency,onCountry,initialArea,stayQuery,showAreaForm=true}:{currency:string;onCountry:(country:string)=>void;initialArea?:{country:string;city:string};stayQuery?:string;showAreaForm?:boolean}){
  const params=useSearchParams(),[query,setQuery]=useState(initialArea?.country?new URLSearchParams({country:initialArea.country,...(initialArea.city?{city:initialArea.city}:{})}).toString():""),[retry,setRetry]=useState(0),[country,setCountry]=useState(initialArea?.country||""),[city,setCity]=useState(initialArea?.city||"");
  const [data,setData]=useState<Discovery|null>(null),[loading,setLoading]=useState(true),[moreLoading,setMoreLoading]=useState(false),[error,setError]=useState("");
  const [shown,setShown]=useState(8),currentKey=query+":"+retry;
  const active=useRef("");active.current=currentKey;
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError("");setData(null);setMoreLoading(false);setShown(8);
    void fetch("/api/hotels/discovery"+(query?"?"+query:""),{signal:controller.signal}).then(async response=>{
      const value=await response.json();if(!value?.scope||!Array.isArray(value.countries)||!Array.isArray(value.items)||!Array.isArray(value.nearby))throw Error();
      if(controller.signal.aborted)return;
      setData(value);onCountry(value.scope.country);
      if(!response.ok)throw Error();
    }).catch(()=>{if(!controller.signal.aborted)setError("Local hotel previews could not be checked. Try another area, retry, or use the worldwide booking search above.");}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[query,retry,onCountry]);
  async function more(){
    if(!data||moreLoading)return;
    if(data.items.length>shown){setShown(n=>n+8);return;}
    if(!data.hasMore)return;
    const started=currentKey;setMoreLoading(true);
    try{
      const next=new URLSearchParams({country:data.scope.country,page:String(data.scope.page+1)});
      const response=await fetch("/api/hotels/discovery?"+next);if(!response.ok)throw Error();
      const value:Discovery=await response.json();if(active.current!==started)return;
      setData(old=>{if(!old)return old;const records=new Map([...old.items,...value.items].map(item=>[item.id,item]));return {...old,items:[...records.values()],scope:{...old.scope,page:value.scope.page},hasMore:value.hasMore};});setShown(n=>n+8);setError("");
    }catch{if(active.current===started)setError("More hotels could not be checked. Your current previews are still here; please retry.");}
    finally{if(active.current===started)setMoreLoading(false);}
  }
  const selectedCurrency=hotelCurrency(currency);
  const href=(hotel:HotelProfile)=>{
    const fields=new URLSearchParams(stayQuery??params.toString());
    const ambiguous=["checkin","checkout","occupancies","currency"].some(key=>fields.getAll(key).length>1);
    fields.delete("placeId");fields.set("hotelId",hotel.id);
    const restored=ambiguous?null:parseHotelBookingSearch(fields);
    if(restored)return hotelWhiteLabelUrl({...restored,placeId:undefined,hotelId:hotel.id,currency:selectedCurrency});
    const url=new URL("/hotels/"+encodeURIComponent(hotel.id),HOTEL_BOOKING_ORIGIN);url.search=new URLSearchParams({language:"en",currency:selectedCurrency}).toString();return url.toString();
  };
  const name=data?.countries.find(item=>item.code===data.scope.country)?.name||data?.scope.country;
  const cards=(items:HotelProfile[])=> <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">{items.map(hotel=><article key={hotel.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    <a href={href(hotel)} target="_blank" rel="noopener noreferrer sponsored" className="block h-40 overflow-hidden bg-[var(--bg-soft)]" aria-label={"Check rooms at "+hotel.name}>
      <HotelPropertyImage src={hotel.image} name={hotel.name} className="h-full w-full object-cover" placeholderClassName="flex h-full items-center justify-center text-[var(--text-soft)]"/>
    </a>
    <div className="flex flex-1 flex-col gap-2 p-4"><p className="flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13} aria-hidden="true"/>{hotel.city||name}</p><h3 className="text-base font-semibold">{hotel.name}</h3>
      {hotel.stars&&<p className="text-xs text-[var(--text-soft)]">{hotel.stars}-star hotel · Supplier classification</p>}
      <p className="line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{hotel.address}</p>
      <a href={href(hotel)} target="_blank" rel="noopener noreferrer sponsored" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-2 text-sm font-semibold underline underline-offset-4">See rooms &amp; availability <ArrowUpRight size={15} aria-hidden="true"/></a>
    </div>
  </article>)}</div>;
  return <section className="mx-auto max-w-7xl px-4 py-8 text-[var(--text)] sm:px-6" aria-labelledby="hotel-local-title">
    <header><p className="text-xs font-semibold uppercase tracking-[.15em] text-[var(--text-soft)]">Closer to you</p><h2 id="hotel-local-title" className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{data?.scope.city?"Start with stays in "+data.scope.city:name?"Discover stays in "+name:"Find your next stay, closer to home."}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Explore your area first, then your country and the rest of the world. You can always choose a different location.</p></header>
    {showAreaForm&&<form className="my-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={event=>{event.preventDefault();if(city.trim()&&!country){setError("Choose a country before searching a city.");return;}setQuery(country?new URLSearchParams({country,...(city.trim()?{city:city.trim()}:{})}).toString():"");setRetry(n=>n+1);}}>
      <label className="min-w-0 flex-1 text-xs font-semibold">Country<select aria-label="Hotel discovery country" value={country} onChange={event=>setCountry(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)]"><option value="">Use my area automatically</option>{data?.countries.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label className="min-w-0 flex-1 text-xs font-semibold">City (optional)<input aria-label="Hotel discovery city" value={city} maxLength={80} onChange={event=>setCity(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)]" placeholder="Choose a city"/></label>
      <button className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold" type="submit">Explore area</button>
    </form>}
    {loading&&<p role="status" className="rounded-2xl border border-[var(--border)] p-5 text-sm">Finding hotel previews for your area…</p>}
    {data?.nearby.length? <div className="mb-7"><h3 className="mb-4 text-lg font-semibold">Around {data.scope.city}</h3>{cards(data.nearby)}</div>:null}
    {data?.items.length?<div><h3 className="mb-4 text-lg font-semibold">More stays in {name}</h3>{cards(data.items.slice(0,shown))}</div>:null}
    {!loading&&!error&&data?.available&&!data.items.length&&!data.nearby.length&&<p className="rounded-2xl border border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">{data.scope.country?"No property previews were returned for this area. This does not mean rooms are sold out. Try the worldwide booking search above.":"Select a country to explore its hotels, or search any destination above."}</p>}
    {error&&<p role="status" className="mt-4 text-sm leading-6 text-[var(--text-soft)]">{error}<button type="button" onClick={()=>setRetry(n=>n+1)} className="gth-btn ms-3 inline-flex min-h-11 items-center gap-2 px-4"><RotateCcw size={14} aria-hidden="true"/>Retry local hotels</button></p>}
    {data?.partial&&!error&&<p role="status" className="mt-4 text-sm text-[var(--text-soft)]">Some area previews could not be checked. The available hotel profiles are shown above.<button type="button" className="gth-btn ms-3 inline-flex min-h-11 items-center px-4" onClick={()=>setRetry(n=>n+1)}>Retry area previews</button></p>}
    {data&&(data.hasMore||data.items.length>shown)&&<button type="button" disabled={moreLoading} onClick={()=>void more()} className="gth-btn mt-5 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">{moreLoading?"Loading more hotels…":"Explore more in "+name}</button>}
    <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]">Hotel profiles and photographs are supplied by Nuitee. Choose dates on the booking site to check current rooms, total prices and cancellation terms.</p>
  </section>;
}
