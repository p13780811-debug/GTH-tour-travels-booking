import {getSupplierCatalog} from "@/lib/tours/supplier-catalog";
import {WEGOTRIP_CARD_DOCUMENTATION} from "@/lib/tours/supplier-products";
import type {ExperiencePath,TourSearch} from "@/lib/tours/discovery";
import SupplierTourCard from "./SupplierTourCard";
export default async function SupplierTourCatalog({search,basePath}:{search:TourSearch;basePath:ExperiencePath}){
 const result=await getSupplierCatalog({...search,page:String(search.page)},basePath);
 if(result.status==="invalid"||result.status==="empty")return null;
 return <section aria-label="Original WeGoTrip products" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
  <h2 className="text-xl font-bold">{basePath==="/tours"?"Audio tours from WeGoTrip":"Tickets and experiences from WeGoTrip"}</h2>
  {result.status==="unavailable"?<p role="status" className="mt-3 text-sm text-[var(--text-soft)]">The supplier catalogue is temporarily unavailable. You can still use the booking partners below.</p>:<>
   <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">A featured selection from the supplier catalogue{search.city?" for "+search.city:""}. Photos and product details supplied by WeGoTrip; open the exact product to confirm availability and terms.</p>
   <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{result.items.map(product=><SupplierTourCard key={product.provider+":"+product.id} product={product}/>)}</div>
   <p className="mt-3 text-xs text-[var(--text-soft)]">Confirm the latest details on the product page. <a href={WEGOTRIP_CARD_DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="underline">Supplier API source</a> · <a href="/affiliate-disclosure" className="underline">Affiliate disclosure</a></p>
  </>}
 </section>;
}
