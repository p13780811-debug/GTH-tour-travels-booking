"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Filter, MapPin, Search, Star } from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import type { LiveHotel } from "@/lib/travel/liteapi-view-model";

type ApiResponse = {items: LiveHotel[]; page:number; hasMore:boolean; error?:string};
const PICKS = [
  {city:"Dubai",country:"AE"},
  {city:"Mumbai",country:"IN"},
  {city:"Panaji",country:"IN"},
  {city:"London",country:"GB"},
  {city:"Paris",country:"FR"},
  {city:"Singapore",country:"SG"},
];
function LiveSearch() {
  const params = useSearchParams();
  const startCity = params.get("city") || "Dubai";
  const startCountry = params.get("country") || "AE";
  const [city, setCity] = useState(startCity);
  const [country, setCountry] = useState(startCountry);
  const [search, setSearch] = useState({ city:startCity, country:startCountry, page:1 });
  const [items, setItems] = useState<LiveHotel[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minStars, setMinStars] = useState(0);
  const [amenity, setAmenity] = useState("");
  const [hotelType, setHotelType] = useState("");
  const [sort, setSort] = useState("name");
  const [filterOpen, setFilterOpen] = useState(false);
  const submit = useCallback((c:string, k:string) => {
    const nextCity = c.trim(), nextCountry = k.trim().toUpperCase();
    if (!/^[\p{L}\p{M} .'-]{2,80}$/u.test(nextCity) || !/^[A-Z]{2}$/.test(nextCountry)) {
      setError("Enter a valid city and two-letter ISO country code."); return;
    }
    setError("");
    setMinStars(0);
    setAmenity("");
    setHotelType("");
    setSearch({ city:nextCity, country:nextCountry, page:1 });
    window.history.replaceState(null, "", "/hotels/live?city="+encodeURIComponent(nextCity)+"&country="+encodeURIComponent(nextCountry));
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError("");
    const query = new URLSearchParams({ city:search.city,country:search.country,page:String(search.page) });
    fetch("/api/hotels/live?"+query, { signal:abort.signal, cache:"no-store" })
      .then(async (response) => {
        const data = await response.json() as ApiResponse;
        if (!response.ok || !Array.isArray(data.items)) throw Error("Provider unavailable");
        if (!abort.signal.aborted) {
          setItems(previous => search.page === 1 ? data.items
            : [...new Map([...previous, ...data.items].map(item=>[item.id,item])).values()]);
          setMore(data.hasMore === true);
        }
      })
      .catch(() => { if (!abort.signal.aborted) {setError("Live hotel content is unavailable. Retry this search."); if (search.page===1) setItems([]);} })
      .finally(()=>{if(!abort.signal.aborted)setLoading(false);});
    return () => abort.abort();
  }, [search]);
  const amenityOptions = useMemo(() => [...new Set(items.flatMap(h=>h.amenities))].slice(0,30),[items]);
  const typeOptions = useMemo(() => [...new Set(items.map(h=>h.category).filter((s):s is string=>Boolean(s)))].sort(),[items]);
  const shown = useMemo(() => {
    const filtered = items.filter(h => (minStars === 0 || (h.stars !== null && h.stars >= minStars))
      && (!amenity || h.amenities.includes(amenity)) && (!hotelType || h.category === hotelType));
    return filtered.sort((a,b)=>sort==="stars" ? (b.stars ?? -1)-(a.stars ?? -1)
      : a.name.localeCompare(b.name));
  },[items,minStars,amenity,hotelType,sort]);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 md:px-6 md:py-12">
      <Link href="/hotels" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] hover:underline"><ArrowLeft size={16}/> Hotel marketplace</Link>
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-5 md:p-9">
        <span className="gold-text text-xs font-bold uppercase tracking-widest">GTH PRO · Provider hotel discovery</span>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">Worldwide hotels, real property names</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Explore live LiteAPI hotel content. Property ratings and facilities appear only when the provider supplies them. Prices, room availability, booking and cancellation terms are not checked here.</p>
        <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_9rem_auto]" onSubmit={event=>{event.preventDefault();submit(city,country);}}>
          <label className="grid gap-1 text-xs font-semibold">Destination city<input className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text)]" value={city} maxLength={80} onChange={event=>setCity(event.target.value)} required /></label>
          <label className="grid gap-1 text-xs font-semibold">Country (ISO-2)<input className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-base text-[var(--text)]" value={country} maxLength={2} onChange={event=>setCountry(event.target.value.toUpperCase())} required /></label>
          <button type="submit" className="gth-btn-gold self-end inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold"><Search size={17}/> Search hotels</button>
        </form>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Popular destination searches">
          {PICKS.map(p=><button key={p.city} type="button" onClick={()=>{setCity(p.city);setCountry(p.country);submit(p.city,p.country);}} className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold">{p.city}</button>)}
        </div>
      </header>
      <section className="flex items-end justify-between gap-4">
        <div><h2 className="text-xl font-bold md:text-3xl">Hotels in {search.city}</h2><p className="mt-1 text-sm text-[var(--text-soft)]">{items.length} unique properties loaded · Provider directory, not confirmed bookable inventory</p></div>
        <button type="button" onClick={()=>setFilterOpen(o=>!o)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm md:hidden" aria-expanded={filterOpen}><Filter size={16}/> Filters</button>
      </section>
      <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={(filterOpen?"block":"hidden")+" md:block"}>
          <div className="gth-glass space-y-5 rounded-2xl border border-[var(--border)] p-5 md:sticky md:top-20">
            <h3 className="font-bold">Filter loaded results</h3>
            <label className="grid gap-2 text-sm">Star classification
              <select className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" value={minStars} onChange={e=>setMinStars(Number(e.target.value))}>
                <option value={0}>Any verified stars</option><option value={3}>3+ stars</option><option value={4}>4+ stars</option><option value={5}>5 stars</option>
              </select></label>
            <label className="grid gap-2 text-sm">Provider-listed type
              <select className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" value={hotelType} onChange={e=>setHotelType(e.target.value)}>
                <option value="">All provider-listed types</option>{typeOptions.map(t=><option key={t} value={t}>{t}</option>)}
              </select></label>
            <label className="grid gap-2 text-sm">Provider-listed facility
              <select className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" value={amenity} onChange={e=>setAmenity(e.target.value)}>
                <option value="">All facilities</option>{amenityOptions.map(a=><option key={a} value={a}>{a}</option>)}
              </select></label>
            <label className="grid gap-2 text-sm">Sort loaded results
              <select className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="name">Property name</option><option value="stars">Verified stars (highest)</option>
              </select></label>
            <p className="text-xs leading-5 text-[var(--text-soft)]">Filters apply to the currently loaded provider results, not every hotel worldwide. Room price and cancellation filters require a live rates integration.</p>
          </div>
        </aside>
        <div className="min-w-0 space-y-5" aria-live="polite">
          {error && <div role="alert" className="rounded-xl border border-[var(--border)] p-5">{error}<button onClick={()=>setSearch(q=>({...q}))} className="gold-text ml-3 underline">Retry</button></div>}
          {shown.length>0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map(h=>{
            const qp=new URLSearchParams();
            if(h.image&&h.photoProof){qp.set("photo",h.image);qp.set("proof",h.photoProof);}
            const href="/hotels/live/"+encodeURIComponent(h.id)+(qp.size?"?"+qp.toString():"");
            return <article key={h.id} className="gth-glass min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]">
              <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-2">
                <HotelPropertyImage src={h.image} name={h.name} className="h-48 w-full object-cover" placeholderClassName="flex h-48 items-center justify-center"/>
                <div className="space-y-3 p-4">
                  <p className="text-xs text-[var(--text-soft)]">{h.category||"Accommodation"} · LiteAPI hotel directory</p>
                  <h3 className="line-clamp-2 text-lg font-bold">{h.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={14}/>{h.city||search.city}{h.country?", "+h.country:""}</p>
                  <p className="text-sm">{h.stars!==null?<span className="inline-flex items-center gap-1"><Star size={15}/> {h.stars} provider stars</span>:"Star rating not provided"}</p>
                  <div className="gold-text inline-flex items-center gap-2 text-sm font-semibold">Hotel details <ArrowRight size={15}/></div>
                </div>
              </Link>
            </article>;
          })}</div>}
          {!loading&&!error&&shown.length===0&&<div role="status" className="gth-glass rounded-xl border border-[var(--border)] p-8 text-sm">No matching hotel records in the loaded page. Clear filters or choose another destination.</div>}
          {loading&&<p role="status" className="rounded-xl border border-[var(--border)] p-5">Loading source-backed hotel content…</p>}
          {!loading&&more&&<button onClick={()=>setSearch(q=>({...q,page:q.page+1}))} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold">Load more hotels <ArrowRight size={16}/></button>}
          <p className="text-xs text-[var(--text-soft)]">Source: LiteAPI / Nuitée. Provider photography belongs to its respective rights holders. GTH PRO does not claim room availability, prices or exact booking matches.</p>
        </div>
      </div>
    </div>
  </main>;
}
import { Suspense } from "react";
export default function LiveHotelPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[var(--bg)] px-6 py-20 text-[var(--text)]">Preparing hotel search…</main>}><LiveSearch/></Suspense>;
}
