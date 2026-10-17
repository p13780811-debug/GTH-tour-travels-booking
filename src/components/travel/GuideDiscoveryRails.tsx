import Link from "next/link";
import {BookOpen,Compass,ArrowRight,MapPin} from "lucide-react";
import TourCarousel from "@/components/tours/TourCarousel";
import {discoveryRows,guideBySlug} from "@/lib/travel/guideCatalog";
import type {CountryCount} from "@/lib/travel/osmAttractions";
import type {ApprovedGuideMedia} from "@/lib/travel/guideMedia";

/** Four discoverable rails; never invent attraction counts or imagery. */
export default function GuideDiscoveryRails({media,countries=[]}:{media:Map<string,ApprovedGuideMedia>;countries?:CountryCount[]}){
 const counts=new Map(countries.map(item=>[item.country_code,Number(item.records)||0]));
 return <section className="mx-auto max-w-7xl space-y-9 px-4 py-10 sm:px-6" aria-label="Destination guide collections">
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">Discover · Plan · Book</p>
    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Explore practical destination guides</h2>
    <p className="mt-2 max-w-3xl text-sm text-[var(--text-soft)]">Editorial travel planning and community-mapped source records are shown separately. Photo rights and content reviews control search indexing.</p>
   </div>
   <Link href="/guides" className="inline-flex min-h-11 items-center gap-2 text-sm underline">All travel guides <ArrowRight size={15}/></Link>
  </div>
  {discoveryRows.map(row=><div key={row.title}>
   <div className="mb-2"><h3 className="text-xl font-semibold">{row.title}</h3><p className="mt-1 text-xs text-[var(--text-soft)]">{row.description}</p></div>
   <TourCarousel label={row.title+" destination cards"}>
    {[...row.slugs].sort((a,b)=>{
      const first=guideBySlug(a),second=guideBySlug(b);
      const delta=(second?counts.get(second.countryCode)||0:0)-(first?counts.get(first.countryCode)||0:0);
      return delta||row.slugs.indexOf(a)-row.slugs.indexOf(b);
    }).map(slug=>{
     const item=guideBySlug(slug);if(!item)return null;
     const picture=media.get(slug);
     const count=counts.get(item.countryCode)||0;
     return <article key={slug} className="flex w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-[275px]">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg)]">
       {picture?<img src={picture.image_url} width={picture.width} height={picture.height} alt={picture.alt_text} loading="lazy" decoding="async" className="h-full w-full object-cover"/>:
       <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--text-soft)]"><Compass size={23}/><span>Rights-approved photo pending</span></div>}
       <span className="absolute bottom-2 left-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] font-semibold">{item.kind==="country"?"Country":"Destination"} guide</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
       <h4 className="text-lg font-bold">{item.name}</h4>
       <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{item.summary}</p>
       <p className="mt-3 flex items-center gap-1 text-[11px] text-[var(--text-soft)]"><MapPin size={12}/>{count?(item.kind==="country"?"Imported places: ":"Country directory: ")+count.toLocaleString("en-IN"):"Import in progress — browse when available"}</p>
       <div className="mt-auto flex flex-wrap gap-x-3 gap-y-2 pt-4 text-xs">
        <Link href={"/guides/"+item.slug} className="inline-flex items-center gap-1 font-semibold underline"><BookOpen size={13}/> Explore guide</Link>
        <Link href={"/attractions?country="+item.countryCode} className="underline">Browse mapped places</Link>
        <Link href={item.city?"/hotels/results?city="+encodeURIComponent(item.city):"/hotels"} className="underline">Find hotels</Link>
        <Link href="/ai-trip" className="underline">Plan trip</Link>
       </div>
       {picture&&<a href={picture.source_page} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 line-clamp-1 text-[10px] text-[var(--text-soft)] underline">Photo: {picture.attribution_text} · {picture.license_type}</a>}
      </div>
     </article>;
    })}
   </TourCarousel>
  </div>)}
 </section>;
}
