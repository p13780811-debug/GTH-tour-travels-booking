import Link from "next/link";
import {ArrowRight,Compass,ExternalLink,MapPin,Globe2} from "lucide-react";
import {directoryHref,listPlaces,type Place} from "@/lib/travel/osmAttractions";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
type Props={region?:"goa"|"india";countryName?:string|null;city?:string|null};
export default async function OSMAttractionsRail({region,countryName,city}:Props){
 const code=countryCodeForDestinationName(countryName);
 const target=directoryHref({...(code?{country:code}:{}),...(region?{region}:{}),...(city&&code&&region!=="goa"?{city}: {})});
 const recognized=!!region||!!code||!countryName;
 let places:Place[]=[];
 let countryWide=false;
 if(recognized){
  try{
   const scope={...(region?{region}:{}),...(code?{country:code}:{}),limit:18};
   if(city&&code&&region!=="goa"&&/^[\p{L}\p{N} .'-]{1,70}$/u.test(city)){
    const local=await listPlaces({...scope,city});
    places=local.items;
    if(!places.length){places=(await listPlaces(scope)).items;countryWide=true;}
   }else places=(await listPlaces(scope)).items;
  }catch{return <section className="mx-auto max-w-7xl px-4 py-4 text-xs text-[var(--text-soft)]"><Link href="/attractions" className="underline">Global mapped attractions directory</Link> is temporarily unavailable.</section>;}
 }
 const heading=region==="goa"?"Goa":countryName||(region==="india"?"India":"Worldwide");
 const browseHref=countryWide||!places.length?directoryHref({...(code?{country:code}:{}),...(region?{region}: {})}):target;
 return <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]" aria-label="Worldwide source-mapped attractions">
  <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
   <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div>
     <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><Globe2 size={15}/> © OpenStreetMap contributors · ODbL 1.0</p>
     <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{heading} community-mapped places</h2>
     <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{countryWide?"Country-wide source places are shown because no city-tagged records are indexed yet. ":places.length?"Browse original mapped landmarks and local places. ":"Country source records are not indexed yet. " }These are not independently verified venues or bookable tickets.</p>
    </div>
    <Link href={browseHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">Browse full directory <ArrowRight size={15}/></Link>
   </div>
   {places.length>0?<div role="region" aria-label="Community mapped attractions horizontal rail" tabIndex={0} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
    {places.map(place=><article key={place.source_id} className="flex h-64 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
     <span className="self-start rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"><Compass size={23}/></span>
     <p className="mt-3 text-xs capitalize text-[var(--text-soft)]">{place.category.replaceAll("-"," ")}</p>
     <h3 className="mt-2 line-clamp-2 text-sm font-semibold">{place.name}</h3>
     <p className="mt-2 line-clamp-1 flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13}/>{place.city||place.country_name||"OSM source"}</p>
     <a href={place.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-auto inline-flex items-center gap-1 text-xs font-semibold underline">Open original OSM place <ExternalLink size={13}/></a>
    </article>)}
   </div>:<p role="status" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">Regional ingestion is incremental. View countries with data on the global progress dashboard.</p>}
  </div>
 </section>;
}
