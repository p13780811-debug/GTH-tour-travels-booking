import reviewed from "@/data/tours/reviewed-partner-products.json";
import {eligiblePartnerProducts} from "@/lib/tours/reviewed-partner-products";
import type {TourSearch,ExperiencePath} from "@/lib/tours/discovery";
import ReviewedPartnerCard from "./ReviewedPartnerCard";
/** Approved snapshots only. Unavailable feeds never synthesize supplier products. */
export default function ReviewedPartnerCatalog({search,basePath}:{search:TourSearch;basePath:ExperiencePath}){
 const products=eligiblePartnerProducts(reviewed as unknown[],search.city,search.category,basePath,search.currency);
 if(!products.length)return null;
 return <section aria-label="Reviewed partner products" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
  <h2 className="text-xl font-bold">Verified supplier experiences</h2>
  <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Original supplier-product links and photos from reviewed partner feeds. Travelpayouts Drive may convert eligible links to tracked referrals. Confirm current price and tickets on each supplier page.</p>
  <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(product=><ReviewedPartnerCard key={product.provider+":"+product.provider_product_id} product={product}/>)}</div>
 </section>;
}
