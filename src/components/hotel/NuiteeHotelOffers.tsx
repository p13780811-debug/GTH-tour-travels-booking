"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Globe2,MapPin,ShieldCheck} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
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
        <Link href="/hotels?view=booking" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-center text-xs font-semibold">
          Search rooms <ArrowUpRight size={14} aria-hidden="true"/>
        </Link>
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
        if(!controller.signal.aborted)setHotels(value.filter(validHotel).slice(0,Math.min(9,Math.max(1,limit))));
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
      <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">No source-backed directory hotels returned for this area. Search available rooms using the existing Nuitee booking form.</p>
    )}
  </div>;
}
/** One real, source-backed directory hotel per selected city — not an invented top-rated list.
 * Further discovery stays available through the existing market guide and Nuitee search. */
const INDIA_SHOWCASE=["mumbai","kolkata","delhi","chennai","hyderabad","ahmedabad"] as const;
const WORLD_SHOWCASE=["london","paris","new-york","dubai","singapore","tokyo","bangkok","rome"] as const;

function ShowcaseCity({slug}:{slug:string}){
  const market=getHotelMarket(slug);
  if(!market)return null;
  return <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4"
    aria-label={"A sample hotel in "+market.city}>
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-soft)]">{market.country} · Hotel directory sample</p>
        <h4 className="mt-1 text-lg font-semibold">{market.city}</h4>
      </div>
      <Link href={"/hotels/explore/"+market.slug} className="text-xs font-semibold underline underline-offset-2">
        Explore city hotels
      </Link>
    </div>
    <FreeHotelDirectoryCards marketSlug={slug} limit={1}/>
  </section>;
}

/** On /hotels only, after the existing booking experience. No vendor CSS or global overrides. */
export default function NuiteeHotelOffers(){
  return <section aria-labelledby="gth-free-hotels" className="mx-auto max-w-7xl px-4 pb-12 pt-8 text-[var(--text)] sm:px-6">
    <div className="mb-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--gold)]"><Globe2 size={15}/> GTH PRO hotel discovery</p>
      <h2 id="gth-free-hotels" className="mt-2 text-2xl font-bold md:text-3xl">Explore hotels across India and the world</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
        Explore a real directory hotel from each featured city, then browse its local catalog. This selection shows the geographic breadth of GTH PRO's free hotel directory; it is not a ranking, a guarantee of inventory in every destination, or proof of room availability.
      </p>
    </div>
    <section aria-labelledby="gth-india-hotel-samples">
      <h3 id="gth-india-hotel-samples" className="text-xl font-bold">Explore India · City by city</h3>
      <p className="mb-4 mt-1 text-sm text-[var(--text-soft)]">Mumbai, Kolkata, New Delhi, Chennai, Hyderabad and Ahmedabad — one source-backed hotel per city when catalog data is available.</p>
      <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {INDIA_SHOWCASE.map(slug=><ShowcaseCity key={slug} slug={slug}/>)}
      </div>
    </section>
    <section aria-labelledby="gth-global-hotel-samples" className="mt-10">
      <h3 id="gth-global-hotel-samples" className="text-xl font-bold">Explore Worldwide · City by city</h3>
      <p className="mb-4 mt-1 text-sm text-[var(--text-soft)]">Browse examples across Europe, North America, the Middle East and Asia, with the same familiar GTH PRO design.</p>
      <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WORLD_SHOWCASE.map(slug=><ShowcaseCity key={slug} slug={slug}/>)}
      </div>
    </section>
    <section aria-labelledby="gth-all-hotel-cities" className="mt-9">
      <h3 id="gth-all-hotel-cities" className="mb-3 text-lg font-semibold">Browse more hotel destinations</h3>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {HOTEL_MARKETS.map(m=><Link key={m.slug} href={"/hotels/explore/"+m.slug}
          className="flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold hover:border-[var(--gold)]">{m.city}</Link>)}
      </div>
    </section>
    <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <h3 className="text-base font-semibold">Need a different destination or live room prices?</h3>
      <p className="mt-2 text-sm text-[var(--text-soft)]">Use the existing worldwide Nuitee White Label search. It handles destination, dates, guests, availability and booking; exact hotel matches are not guaranteed by these directory cards.</p>
      <Link href="/hotels?view=booking" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        Search worldwide hotel rooms <ArrowUpRight size={16} aria-hidden="true"/>
      </Link>
    </div>
    <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
      <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0"/>
      Directory hotel records are source-attributed locations, not confirmed Nuitee listings. Pricing and payment remain with the existing booking provider. No new paid API is required.
    </p>
  </section>;
}
