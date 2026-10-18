import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Compass,ExternalLink,Globe2,MapPin,Search,BarChart3} from "lucide-react";
import {ATTRACTION_TYPES,directoryHref,listPlaces,sourceProgress,validFilters,type DirectoryFilters} from "@/lib/travel/osmAttractions";
import {discoveryRows} from "@/lib/travel/guideCatalog";
import {publishedMedia} from "@/lib/travel/guideMedia";
import GuideDiscoveryRails from "@/components/travel/GuideDiscoveryRails";
import {listMappedCities} from "@/lib/travel/mappedCities";
import MappedCityDiscovery from "@/components/travel/MappedCityDiscovery";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Worldwide Community-Mapped Attractions | GTH PRO",
 description:"Search real OpenStreetMap landmarks by country, city and category with original source links and transparent regional sync progress.",
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
const one=(v:string|string[]|undefined)=>typeof v==="string"?v:"";
export default async function AttractionsDirectory({searchParams}:Props){
 const raw=await searchParams;
 const f:DirectoryFilters={
  country:one(raw.country).toUpperCase(),region:one(raw.region)||"all",category:one(raw.category),
  q:one(raw.q).trim(),city:one(raw.city).trim(),after:one(raw.after),limit:24
 };
 const valid=validFilters(f);
 const [places,progress,guidePhotos,mappedCities]=await Promise.allSettled([valid?listPlaces(f):Promise.reject(new Error("Invalid filters")),sourceProgress(),publishedMedia(discoveryRows.flatMap(r=>[...r.slugs])),listMappedCities({pageSize:24})]);
 const result=places.status==="fulfilled"?places.value:null;
 const stats=progress.status==="fulfilled"?progress.value:null;
 const media=guidePhotos.status==="fulfilled"?guidePhotos.value:new Map();
 const next=result?.nextCursor?directoryHref({...f,after:result.nextCursor}):null;
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 md:py-12">
   <nav className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/tours" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={17}/> Tours & Activities</Link>
    <Link href="/attractions/progress" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline"><BarChart3 size={17}/> Full import dashboard</Link>
   </nav>
   <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><Globe2 size={16}/> Worldwide open attractions · © OpenStreetMap contributors</p>
   <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Discover mapped places around the world</h1>
   <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Explore source-linked beaches, landmarks, forts, museums and parks. Coverage grows as official Geofabrik extracts finish importing. A map record does not certify an operating venue, ticket or attraction availability.</p>
   <section aria-label="Real source directory progress" className="mt-7 grid gap-3 sm:grid-cols-3">
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-soft)]">Imported public map records</p><p className="mt-2 text-2xl font-bold">{stats?stats.total.toLocaleString("en-IN"):"Unavailable"}</p></div>
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-soft)]">Countries with imported records</p><p className="mt-2 text-2xl font-bold">{stats?stats.countriesWithRecords:"Unavailable"}</p></div>
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-soft)]">Last completed source sync</p><p className="mt-2 text-sm font-semibold">{stats?.runs[0]?stats.runs[0].country_name+" · "+new Date(stats.runs[0].completed_at).toLocaleDateString("en-IN",{dateStyle:"medium"}):"No completed runs recorded yet"}</p></div>
   </section>
   <form role="search" action="/attractions" method="get" className="mt-7 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
    <label className="text-xs font-semibold">Search mapped place
     <input type="search" name="q" defaultValue={f.q} maxLength={70} placeholder="Beach, fort, museum..." className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">Imported country
     <select name="country" defaultValue={f.country||""} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
      <option value="">All indexed countries</option>
      {stats?.countries.map(row=><option key={row.country_code} value={row.country_code}>{row.country_name} ({Number(row.records).toLocaleString("en-IN")})</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">Source category
     <select name="category" defaultValue={f.category||""} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm">
      <option value="">All mapped categories</option>
      {ATTRACTION_TYPES.map(t=><option key={t} value={t}>{t.replaceAll("-"," ")}</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold">City (when source tagged)
     <input type="search" name="city" defaultValue={f.city} maxLength={70} placeholder="e.g. Mumbai" className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm"/>
    </label>
    <div className="flex items-center gap-2">
     <button type="submit" className="gth-btn-gold inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm"><Search size={16}/> Search</button>
     <Link href="/attractions" className="inline-flex min-h-11 items-center px-2 text-xs underline">Reset</Link>
    </div>
   </form>
   <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
    <Link href="/attractions?region=goa" className="underline">Goa source group</Link>
    <Link href="/attractions?country=IN" className="underline">India places</Link>
    <Link href="/attractions/progress" className="underline">Countries & sync history</Link>
   </div>
   <GuideDiscoveryRails media={media} countries={stats?.countries??[]}/>
   <MappedCityDiscovery cities={mappedCities.status==="fulfilled"?mappedCities.value.items:[]} title="More cities from real public maps"/>
   {!valid?<div role="alert" className="mt-7 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">Invalid search. Please remove unsupported symbols or filters.</div>:
    !result?<div role="status" className="mt-7 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">Mapped source directory temporarily unavailable. Existing records are not deleted.</div>:
    result.items.length===0?<div role="status" className="mt-7 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">No imported records match these filters yet. Try another country or category; worldwide regional synchronization is incremental.</div>:
    <section className="mt-8" aria-label="Source-linked mapped attractions">
     <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Real community-mapped places</h2>
      <span className="text-xs text-[var(--text-soft)]">{result.items.length} shown · Scroll horizontally · No stock photos</span>
     </div>
     <div role="region" aria-label="Worldwide mapped places horizontal card rail" tabIndex={0} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
      {result.items.map(place=><article key={place.source_id} className="flex h-64 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
       <span className="self-start rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"><Compass size={22}/></span>
       <p className="mt-3 text-xs capitalize text-[var(--text-soft)]">{place.category.replaceAll("-"," ")}</p>
       <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{place.name}</h3>
       <p className="mt-2 line-clamp-2 flex items-start gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13} className="shrink-0"/>{[place.city,place.country_name].filter(Boolean).join(", ")||"Source extract location"}</p>
       <a href={place.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-auto inline-flex items-center gap-2 text-xs font-semibold underline">Original OpenStreetMap entry <ExternalLink size={13}/></a>
      </article>)}
     </div>
     <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-[var(--text-soft)]">Browse every imported result. No 100-page cap.</span>
      <div className="flex items-center gap-3">
       {f.after&&<Link href={directoryHref({...f,after:undefined})} className="rounded-xl border border-[var(--border)] px-4 py-3">First results</Link>}
       {next?<Link href={next} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5">Next 24 <ArrowRight size={16}/></Link>:<span className="text-xs text-[var(--text-soft)]">End of matching records</span>}
      </div>
     </div>
    </section>}
   <p className="mt-9 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">© OpenStreetMap contributors · ODbL 1.0, supplied through Geofabrik official regional extracts. Country grouping is based on extract scope and may include border overlaps. Records are community-mapped information, not independently verified venues, photos, current entry prices or available tours. More countries become browsable only after a successful import.</p>
  </div>
 </main>;
}
