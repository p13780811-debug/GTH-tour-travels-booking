import TravelSectionNav from "@/components/travel/TravelSectionNav";
import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Compass,Search,MapPin,Globe2} from "lucide-react";
import {listMappedCities,validCityFilters,mappedCityLink,mappedCityLabel,cityExplorerHref,type MappedCityFilters} from "@/lib/travel/mappedCities";
import {sourceProgress} from "@/lib/travel/osmAttractions";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Explore Cities with Real Mapped Attractions | GTH PRO",
 description:"Search cities tagged in real OpenStreetMap records. View public attraction sources, nearby planning tools and country-level import progress.",
 alternates:{canonical:"/attractions/cities"},
 robots:{index:false,follow:true},
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
const single=(v:string|string[]|undefined)=>typeof v==="string"?v:"";
export default async function MappedCitiesPage({searchParams}:Props){
 const raw=await searchParams;
 const f:MappedCityFilters={country:single(raw.country).toUpperCase(),search:single(raw.search).trim(),
  page:Number(single(raw.page)||"1"),pageSize:36};
 const valid=validCityFilters(f);
 const [data,progress]=await Promise.all([
  valid?listMappedCities(f).catch(()=>null):Promise.resolve(null),
  sourceProgress().catch(()=>null)
 ]);
 const pages=Math.max(1,Math.ceil((data?.total||0)/36));
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
<header data-travel-hero="true">
   <Link href="/attractions" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> Back to Attractions</Link>
   <p className="mt-5 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-soft)]"><Globe2 size={16}/> GTH PRO · Real city-tagged map records</p>
   <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Explore source-mapped cities worldwide</h1>
   <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
    Find actual OpenStreetMap attractions by city and country, then move to independent tour and hotel providers. City tags are supplied by OSM contributors and may be incomplete. This is not a paid-tour or certified-city directory.
   </p>
</header>
<TravelSectionNav />
   <form role="search" action="/attractions/cities" method="get" className="mt-7 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
    <label className="text-xs font-semibold">Search a city
     <input name="search" type="search" maxLength={60} defaultValue={f.search} placeholder="Mumbai, Paris, Segovia..."
      className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">Imported country
     <select name="country" defaultValue={f.country||""} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
      <option value="">All imported countries</option>
      {progress?.countries.map(c=><option key={c.country_code} value={c.country_code}>{c.country_name}</option>)}
     </select>
    </label>
    <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"><Search size={16}/> Search cities</button>
   </form>
   {!valid?<p role="alert" className="mt-6">Invalid city search or country selection.</p>:
    !data?<p role="status" className="mt-6">Real mapped-city directory is temporarily unavailable.</p>:
    <section aria-label="Live city list" className="mt-8">
     <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-xl font-semibold">{data.total.toLocaleString("en-IN")} source-tagged city groups</h2>
      <p className="text-xs text-[var(--text-soft)]">Showing page {Math.min(f.page||1,pages)} of {pages} · At least 2 recorded places per group</p>
     </div>
     {data.items.length===0?<p role="status" className="rounded-xl border border-[var(--border)] p-6">No matching city tags imported yet. Try another spelling or country.</p>:
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
       {data.items.map(city=><article key={city.country_code+city.city} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="inline-flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13}/>{city.country_name}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold">{mappedCityLabel(city.city)}</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">{city.records.toLocaleString("en-IN")} source-mapped places</p>
        <Link href={mappedCityLink(city.country_code,city.city)} className="gth-btn-gold mt-5 inline-flex min-h-11 items-center justify-between rounded-xl px-3 text-xs font-semibold">
         Browse actual attractions <ArrowRight size={15}/>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
         <Link className="underline" href={"/tours?city="+encodeURIComponent(city.city)}>Search experiences</Link>
         <Link className="underline" href={"/hotels/results?city="+encodeURIComponent(city.city)}>Find hotels</Link>
        </div>
       </article>)}
      </div>}
     <nav aria-label="City pages" className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm">
      {(f.page||1)>1?<Link href={cityExplorerHref({...f,page:(f.page||1)-1})} className="rounded-xl border border-[var(--border)] px-4 py-3">Previous cities</Link>:<span/>}
      {(f.page||1)<pages?<Link href={cityExplorerHref({...f,page:(f.page||1)+1})} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5">Next cities <ArrowRight size={16}/></Link>:<span/>}
     </nav>
    </section>}
   <p className="mt-8 text-xs leading-6 text-[var(--text-soft)]">© OpenStreetMap contributors · ODbL 1.0 via Geofabrik. City labels are contributor-provided address tags, not official administrative boundaries; country reflects imported source scope. No prices, opening hours or bookable tour inventory are implied.</p>
  </div>
 </main>;
}
