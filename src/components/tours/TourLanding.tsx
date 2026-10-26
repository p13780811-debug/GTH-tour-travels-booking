import {Suspense} from "react";
import Image from "next/image";
import Link from "next/link";
import SupplierTourCatalog from "./SupplierTourCatalog";
import ReviewedPartnerCatalog from "./ReviewedPartnerCatalog";
import TourSearchHero from "./TourSearchHero";
import ToursExplorer from "./ToursExplorer";
import TourAffiliateMarketplace from "./TourAffiliateMarketplace";
import {EMPTY_TOUR_SEARCH,EXPERIENCE_MODES,parseTourFilters,tourDiscoveryHref,type ExperiencePath} from "@/lib/tours/discovery";
const destinations=[{city:"Dubai",image:"/images/cities/dubai.jpg"},{city:"London",image:"/images/cities/london.jpg"},{city:"Tokyo",image:"/images/cities/tokyo.jpg"},{city:"Bali",image:"/images/cities/bali.jpg"}];
export default async function TourLanding({searchParams,basePath}:{searchParams:Promise<Record<string,unknown>>;basePath:ExperiencePath}){
 const raw=await searchParams,parsed=parseTourFilters(raw),filters=parsed.ok?parsed.filters:EMPTY_TOUR_SEARCH;
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <TourSearchHero basePath={basePath} filters={filters}/>
  {!parsed.ok&&<p role="alert" className="mx-auto max-w-7xl px-4 py-4 text-sm sm:px-6">{parsed.error} <Link href={basePath} className="underline">Reset search</Link></p>}
  <section aria-label={EXPERIENCE_MODES[basePath].label+" destination inspiration"} className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
   <h2 className="text-base font-semibold">Where would you like to explore?</h2>
   <div className="mt-3 flex gap-3 overflow-x-auto overscroll-x-contain pb-2">
    {destinations.map(item=><Link key={item.city} href={tourDiscoveryHref(basePath,filters,"rail",{city:item.city,page:1})} className="flex min-h-16 shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] pr-4 text-sm font-semibold"><span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-l-xl"><Image src={item.image} alt="" fill sizes="64px" className="object-cover"/></span>{item.city}</Link>)}
   </div>
  </section>
  <div id="discover" className="scroll-mt-24">
   {parsed.ok&&<Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 py-4 text-xs text-[var(--text-soft)]">Loading original supplier tours and photos…</p>}><SupplierTourCatalog search={filters} basePath={basePath}/></Suspense>}
   {parsed.ok&&<ReviewedPartnerCatalog search={filters} basePath={basePath}/>}
   <TourAffiliateMarketplace search={filters} basePath={basePath}/>
   <Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 py-6 text-sm text-[var(--text-soft)] sm:px-6">Loading source-backed listings. Search and booking partners above are ready to use.</p>}>
    <ToursExplorer searchParams={Promise.resolve(raw)} basePath={basePath}/>
   </Suspense>
  </div>
 </main>;
}
