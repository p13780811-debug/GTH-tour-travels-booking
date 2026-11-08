"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Globe2,MapPin,ShieldCheck} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import NuiteeHotelsListWidget from "@/components/hotel/NuiteeHotelsListWidget";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {HOTEL_MARKETS,getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";

/** Free first-party directory cards. Source records are NOT Nuitee hotels or bookable offers. */
type DirectoryHotel={
  id:string|number;name:string;city:string;image:string;source:string;
  country?:string|null;category?:string;booking_ready?:boolean;
  image_attribution?:{author:string;license:string}|null;
};
function validHotel(raw:unknown):raw is DirectoryHotel{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
  const v=raw as Partial<DirectoryHotel>;
  return (typeof v.id==="string"||typeof v.id==="number") &&
    String(v.id).length<120 && typeof v.name==="string"&&v.name.trim().length>=4&&
    typeof v.city==="string"&&typeof v.image==="string"&&
    (v.image==="/placeholder.jpg"||v.image.startsWith("/images/")||v.image.startsWith("https://"));
}
function Card({hotel}:{hotel:DirectoryHotel}){
  const detail="/hotels/stay/"+encodeURIComponent(String(hotel.id));
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)]">
    <Link href={detail} prefetch={false} className="block h-44 overflow-hidden bg-[var(--bg-soft)] sm:h-48" aria-label={"View source information for "+hotel.name}>
      <HotelPropertyImage src={hotel.image} name={hotel.name}
        className="h-full w-full object-cover"
        placeholderClassName="flex h-full w-full items-center justify-center text-[var(--text-soft)]"/>
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <p className="flex items-start gap-1 text-xs text-[var(--text-soft)]"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true"/>{hotel.city}</p>
      <h3 className="line-clamp-2 text-base font-semibold"><Link href={detail} prefetch={false} className="hover:underline">{hotel.name}</Link></h3>
      <p className="text-xs text-[var(--text-soft)]">{hotel.source==="OpenStreetMap"?"© OpenStreetMap contributors · ODbL 1.0":"Source-attributed hotel directory"}</p>
      {hotel.image_attribution&&<p className="text-xs text-[var(--text-soft)]">Photo: {hotel.image_attribution.author} · {hotel.image_attribution.license}</p>}
      <p className="mt-auto pt-2 text-xs text-[var(--text-soft)]">Directory location only. No verified room price or availability; Nuitee search does not guarantee an exact hotel match.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link prefetch={false} href={detail} className="gth-btn inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-center text-xs font-semibold">Hotel details</Link>
        <a href={HOTEL_BOOKING_ORIGIN+"/hotels?language=en&currency=INR"} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-center text-xs font-semibold">
          Search Nuitee rooms <ArrowUpRight size={14} aria-hidden="true"/>
        </a>
      </div>
    </div>
  </article>;
}
export function FreeHotelDirectoryCards({marketSlug,limit=6}:{marketSlug:string;limit?:number}){
  const market=getHotelMarket(marketSlug);
  const marker=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false),[hotels,setHotels]=useState<DirectoryHotel[]>([]);
  const [loading,setLoading]=useState(false),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const element=marker.current;
    if(!element)return;
    if(!("IntersectionObserver" in window)){setVisible(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}
    },{rootMargin:"180px"});
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible||!market)return;
    const controller=new AbortController();
    setLoading(true);setError(false);
    const params=new URLSearchParams({city:market.supplierCity,country:market.countryCode,source:"directory",page:"1"});
    fetch("/api/hotels?"+params.toString(),{signal:controller.signal,cache:"no-store"})
      .then(async response=>{
        if(!response.ok)throw new Error("Hotel directory unavailable");
        const value:unknown=await response.json();
        if(!Array.isArray(value))throw new Error("Invalid directory response");
        if(!controller.signal.aborted)setHotels(value.filter(validHotel).filter(hotel=>hotel.image!=="/placeholder.jpg").slice(0,Math.min(9,Math.max(1,limit))));
      }).catch(()=>{if(!controller.signal.aborted)setError(true);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[visible,market,limit,retry]);
  if(!market)return null;
  return <div ref={marker} className="min-w-0" aria-label={market.city+" source-backed hotel directory cards"}>
    {!visible?<p className="text-sm text-[var(--text-soft)]">Explore source-backed local hotel records below.</p>:null}
    {loading?<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">Loading directory hotels…</p>:null}
    {error?<div role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">
      Hotel directory could not be loaded. The existing Nuitee booking search is still available.
      <button type="button" className="gth-btn ml-3 min-h-10 px-3" onClick={()=>setRetry(n=>n+1)}>Retry</button>
    </div>:null}
    {!loading&&!error&&visible&&(hotels.length?
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">{hotels.map(hotel=><Card key={String(hotel.id)} hotel={hotel}/>)}</div>:
      getHotelEditorialExample(marketSlug)?<EditorialExampleCard slug={marketSlug}/>:
      <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">No source-backed directory hotels returned for this area. Search available rooms using the existing Nuitee booking form.</p>
    )}
  </div>;
}
/** Source-backed global illustration when no GTH-owned catalog hotel is available.
 * It must not masquerade as a verified directory record, affiliate offer or live inventory. */
/** Supplier-native booking cards, not fabricated OSM booking cards.
 * Public directory records and editorial hotel examples remain informational
 * on city-guide pages, never represented as bookable Nuitee inventory.
 */
export default function NuiteeHotelOffers(){
  const booking=HOTEL_BOOKING_ORIGIN+"/hotels?language=en&currency=INR";
  return <section aria-labelledby="gth-nuitee-real-hotels" className="mx-auto max-w-7xl px-4 pb-12 pt-8 text-[var(--text)] sm:px-6">
    <header className="mb-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--gold)]">
        <Globe2 size={15} aria-hidden="true"/> GTH PRO · Nuitee White Label
      </p>
      <h2 id="gth-nuitee-real-hotels" className="mt-2 text-2xl font-bold md:text-3xl">Explore real hotels with photos and booking links</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
        These supplier hotel cards come directly from our connected Nuitee White Label, not from incomplete OpenStreetMap records. Choose a hotel to see its actual listing, photos and room options. No paid catalogue API key is needed.
      </p>
    </header>
    <div className="grid min-w-0 gap-8">
      <section aria-labelledby="gth-nuitee-india" className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
        <h3 id="gth-nuitee-india" className="mb-2 text-xl font-semibold">Hotels in India · Mumbai</h3>
        <NuiteeHotelsListWidget id="gth-hotels-nuitee-mumbai" placeId="ChIJwe1EZjDG5zsRaYxkjY_tpF0" placeLabel="Mumbai" rows={1}/>
      </section>
      <section aria-labelledby="gth-nuitee-global" className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
        <h3 id="gth-nuitee-global" className="mb-2 text-xl font-semibold">Hotels worldwide · London</h3>
        <NuiteeHotelsListWidget id="gth-hotels-nuitee-london" placeId="ChIJdd4hrwug2EcRmSrV3Vo6llI" placeLabel="London" rows={1}/>
      </section>
    </div>
    <div className="mt-9">
      <h3 className="mb-3 text-lg font-semibold">Explore more cities across India and the world</h3>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {HOTEL_MARKETS.map(m=><div key={m.slug} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <p className="text-sm font-semibold">{m.city}</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">{m.country}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href={"/hotels/explore/"+m.slug} className="text-xs underline underline-offset-2">City guide</Link>
            <a href={booking} target="_blank" rel="noopener noreferrer sponsored" className="text-xs font-semibold underline underline-offset-2">
              Nuitee hotels <ArrowUpRight size={12} className="inline" aria-hidden="true"/>
            </a>
          </div>
        </div>)}
      </div>
    </div>
    <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
      <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0"/>
      Supplier availability, photos, prices and booking are handled by Nuitee. A GTH PRO directory entry does not guarantee an exact supplier hotel match; the official supplier cards above carry their own direct booking links.
    </p>
  </section>;
}
