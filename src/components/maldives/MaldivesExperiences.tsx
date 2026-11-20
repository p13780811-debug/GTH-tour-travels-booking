import Link from "next/link";
import {ArrowUpRight,Compass,ShieldCheck} from "lucide-react";
import SupplierTourCard from "@/components/tours/SupplierTourCard";
import {getSupplierCatalog} from "@/lib/tours/supplier-catalog";
import {loadPersistedSupplierProducts} from "@/lib/tours/persisted-inventory";
import {EMPTY_TOUR_SEARCH} from "@/lib/tours/discovery";
import {uniqueSupplierProducts,type SupplierProduct} from "@/lib/tours/supplier-products";

function isMaldivesProduct(product:SupplierProduct):boolean {
  return product.city.country.normalize("NFKC").trim().toLocaleLowerCase("en")==="maldives" &&
    ["male","malé","hulhumale","hulhumalé","maldives"]
      .includes(product.city.name.normalize("NFKC").trim().toLocaleLowerCase("en"));
}

/** Exactly the homepage supplier catalog, validator, photos and product-card UI. */
export default async function MaldivesExperiences(){
  const savedFilter={...EMPTY_TOUR_SEARCH,city:"Malé",currency:"USD"};
  const reads=await Promise.allSettled([
    getSupplierCatalog({city:"Malé",currency:"USD"},"/tours"),
    getSupplierCatalog({city:"Malé",currency:"USD"},"/activities"),
    loadPersistedSupplierProducts(savedFilter,"/tours"),
    loadPersistedSupplierProducts(savedFilter,"/activities"),
  ]);
  const live=reads.slice(0,2).flatMap(result=>result.status==="fulfilled"
    ? (result.value as Awaited<ReturnType<typeof getSupplierCatalog>>).items : []);
  const saved=reads.slice(2).flatMap(result=>result.status==="fulfilled"
    ? result.value as SupplierProduct[] : []);
  const products=uniqueSupplierProducts([...saved,...live].filter(isMaldivesProduct)).slice(0,9);
  return <section id="maldives-experiences" aria-labelledby="maldives-experiences-title"
    className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:py-16">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]">
          <Compass size={16} aria-hidden="true"/> Original supplier experiences
        </p>
        <h2 id="maldives-experiences-title" className="mt-2 text-2xl font-bold sm:text-3xl">
          Island stories & experiences
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Discover Malé heritage, local island journeys, lagoon and snorkeling inspiration.
          Only source-confirmed WeGoTrip products appear as bookable cards.
        </p>
      </div>
      <Link href="/tours?city=Mal%C3%A9#discover"
        className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
        Discover Malé experiences <ArrowUpRight size={16} aria-hidden="true"/>
      </Link>
    </div>
    {products.length ? <>
      <p className="mt-5 text-xs text-[var(--text-soft)]">Original supplier product photos and listed prices · verify dates and final total with the provider.</p>
      <div role="region" aria-label="Maldives original supplier tours — swipe to explore" tabIndex={0}
        className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {products.map(product=><div key={product.provider+":"+product.id}
          className="w-[77vw] max-w-[300px] shrink-0 snap-start lg:w-full lg:max-w-none">
          <SupplierTourCard product={product}/>
        </div>)}
      </div>
    </> : <div role="status" className="mt-6 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <ShieldCheck size={21} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
      <div>
        <h3 className="font-semibold">Source-backed Maldives experiences are being checked</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          No currently verified WeGoTrip Malé product photo, price and direct booking URL was returned.
          We will not fill the carousel with unrelated destinations, invented audio tours or generic partner homepages.
          Use the destination-filtered GTH discovery page to recheck genuine supplier products.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/tours?city=Mal%C3%A9#discover" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            Search Malé tours <ArrowUpRight size={15} aria-hidden="true"/>
          </Link>
          <Link href="/activities?city=Mal%C3%A9#discover" className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
            Search Malé activities <ArrowUpRight size={15} aria-hidden="true"/>
          </Link>
        </div>
      </div>
    </div>}
  </section>;
}
