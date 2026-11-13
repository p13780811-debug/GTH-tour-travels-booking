import {Suspense} from "react";
import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,Hotel,Ticket} from "lucide-react";
import NuiteeHotelsListWidget from "@/components/hotel/NuiteeHotelsListWidget";
import SupplierTourCard from "@/components/tours/SupplierTourCard";
import {getSupplierCatalog} from "@/lib/tours/supplier-catalog";
import {uniqueSupplierProducts,type SupplierProduct} from "@/lib/tours/supplier-products";

const cities=[
 {city:"Mumbai",country:"IN",image:"/images/cities/mumbai.jpg",label:"Mumbai stays"},
 {city:"Kolkata",country:"IN",image:"/images/cities/kolkata.jpg",label:"Kolkata stays"},
 {city:"Goa",country:"IN",image:"/images/cities/goa.jpg",label:"Goa stays"},
 {city:"London",country:"GB",image:"/images/cities/london.jpg",label:"London stays"},
] as const;

/** Editorial city photos are clearly separate from supplier hotel inventory.
 * The Nuitee SDK below renders the actual supplier hotel photo/product cards.
 * No private REST access, paid API refresh or fabricated room-price is added.
 */
function HotelStays(){
 return <section aria-labelledby="app-supplier-hotels" className="mx-auto w-full max-w-7xl py-5">
  <div className="flex items-end justify-between gap-3 px-4 sm:px-6">
   <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">Supplier booking · Hotel stays</p>
    <h2 id="app-supplier-hotels" className="mt-1 text-xl font-bold">Discover stays worldwide</h2>
    <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Nuitee provides hotel photos and booking. Choose your dates to see actual rates.</p>
   </div>
   <Link href="/app/hotels?view=booking" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-bold text-[var(--gold)]">Find stays <ArrowUpRight size={15} aria-hidden="true"/></Link>
  </div>
  <div role="region" aria-label="Hotel destination shortcuts — swipe horizontally" tabIndex={0}
    className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain touch-auto px-4 pb-3 sm:px-6">
   {cities.map(item=><Link key={item.city} href={"/app/hotels?"+new URLSearchParams({view:"booking",city:item.city,country:item.country}).toString()}
      className="group w-[62vw] max-w-[235px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-[230px]">
     <div className="relative h-28 overflow-hidden bg-[var(--bg-soft)]">
      <Image src={item.image} alt={item.city+" destination view"} fill sizes="(max-width:640px) 62vw,230px"
       className="object-cover transition-transform duration-300 group-hover:scale-105"/>
     </div>
     <div className="flex min-h-16 items-center justify-between gap-2 p-3">
      <span><strong className="block text-sm">{item.label}</strong><span className="mt-1 block text-[11px] text-[var(--text-soft)]">Choose a supplier hotel and dates</span></span>
      <ArrowUpRight className="shrink-0 text-[var(--gold)]" size={16} aria-hidden="true"/>
     </div>
    </Link>)}
  </div>
  <div role="region" className="mx-4 mt-2 overflow-x-auto touch-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:mx-6"
   aria-label="Nuitee supplier hotel cards">
   <div className="min-w-[290px]">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Hotel size={15} className="text-[var(--gold)]"/> Hotels near Mumbai · Nuitee</div>
    <NuiteeHotelsListWidget id="gth-home-nuitee-mumbai" placeId="ChIJwe1EZjDG5zsRaYxkjY_tpF0" placeLabel="Mumbai" rows={1} currency="INR"/>
   </div>
  </div>
 </section>;
}

function TourCardRail({items}:{items:SupplierProduct[]}){
 return <div role="region" aria-label="Original supplier tours and activities — swipe horizontally" tabIndex={0}
   className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain touch-auto px-4 pb-4 sm:px-6">
   {items.map(item=><div key={item.provider+":"+item.id} className="w-[77vw] max-w-[285px] shrink-0 snap-start sm:w-[270px]">
    <SupplierTourCard product={item}/>
   </div>)}
 </div>;
}

/** Reads the very same existing public supplier catalogue as the Tours and
 * Activities pages. Existing Next cache governs source read frequency.
 * A source outage never turns illustrative assets into pretend bookable tours.
 */
async function SupplierExperiences(){
 const [tours,activities]=await Promise.all([
  getSupplierCatalog({currency:"USD"},"/tours"),
  getSupplierCatalog({currency:"USD"},"/activities"),
 ]);
 const products=uniqueSupplierProducts([...tours.items,...activities.items]).slice(0,10);
 if(products.length)return <><p className="mt-2 px-4 text-xs text-[var(--text-soft)] sm:px-6">
   Original supplier products and photos · prices are supplier-listed, not live date availability
  </p><TourCardRail items={products}/></>;
 return <nav aria-label="Browse existing tours and activities providers" className="mt-3 grid grid-cols-2 gap-3 px-4 sm:px-6">
  {[{href:"/tours",label:"Browse tours",image:"/images/mega/tours.jpg"},
    {href:"/activities",label:"Browse activities",image:"/images/mega/klook.jpg"}].map(item=>
    <Link key={item.href} href={item.href} className="group min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="relative h-28 bg-[var(--bg-soft)]">
       <Image src={item.image} alt="" fill sizes="(max-width:640px) 50vw,320px" className="object-cover"/>
      </div>
      <span className="flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-xs font-bold">
       {item.label} <ArrowUpRight size={15} className="text-[var(--gold)]" aria-hidden="true"/>
      </span>
    </Link>)}
 </nav>;
}

export default async function MobileSupplierShowcase(){
 return <div className="min-w-0">
  <HotelStays/>
  <section aria-labelledby="app-supplier-tours" className="mx-auto w-full max-w-7xl py-5">
   <div className="flex items-end justify-between gap-3 px-4 sm:px-6">
    <div>
     <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--gold)]"><Ticket size={15} aria-hidden="true"/> Original supplier experiences</p>
     <h2 id="app-supplier-tours" className="mt-1 text-xl font-bold">Tours &amp; activities</h2>
    </div>
    <Link href="/tours" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-bold text-[var(--gold)]">Explore all <ArrowUpRight size={15} aria-hidden="true"/></Link>
   </div>
   <Suspense fallback={<p role="status" className="mx-4 mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--text-soft)] sm:mx-6">Checking original supplier tours and activities…</p>}>
    <SupplierExperiences/>
   </Suspense>
  </section>
 </div>;
}
