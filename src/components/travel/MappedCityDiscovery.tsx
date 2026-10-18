import Link from "next/link";
import {ArrowRight,Compass,Hotel,MapPin} from "lucide-react";
import TourCarousel from "@/components/tours/TourCarousel";
import {mappedCityLink,type MappedCity} from "@/lib/travel/mappedCities";

export default function MappedCityDiscovery({cities,title="More source-mapped cities"}:{
 cities:readonly MappedCity[];title?:string
}){
 if(!cities.length)return null;
 return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Real city-tagged attractions discovery">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
   <div>
    <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">These places come from actual ODbL OpenStreetMap city tags, not generated city listings. Counts refer to community-mapped records, not bookable tickets or independently verified attractions.</p>
   </div>
   <Link href="/attractions/cities" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">
    Browse all mapped cities <ArrowRight size={16}/>
   </Link>
  </div>
  <TourCarousel label="Source-backed cities horizontal discovery">
   {cities.map(item=><article key={item.country_code+":"+item.city}
    className="flex w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:w-[250px]">
    <p className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]"><MapPin size={14}/>{item.country_name}</p>
    <h3 className="mt-3 line-clamp-2 text-lg font-bold">{item.city}</h3>
    <p className="mt-2 text-xs text-[var(--text-soft)]">{item.records.toLocaleString("en-IN")} public mapped records</p>
    <div className="mt-auto grid gap-2 pt-5 text-xs">
     <Link href={mappedCityLink(item.country_code,item.city)} className="gth-btn-gold inline-flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 font-semibold">
      <span className="inline-flex items-center gap-2"><Compass size={14}/> Explore mapped places</span><ArrowRight size={14}/>
     </Link>
     <div className="flex items-center justify-between gap-2">
      <Link href={"/tours?city="+encodeURIComponent(item.city)} className="underline">Search tours</Link>
      <Link href={"/hotels/results?city="+encodeURIComponent(item.city)} className="inline-flex items-center gap-1 underline"><Hotel size={13}/> Hotels</Link>
     </div>
    </div>
   </article>)}
  </TourCarousel>
 </section>;
}
