import {getSupplierCatalog} from "@/lib/tours/supplier-catalog";
import {loadPersistedSupplierProducts} from "@/lib/tours/persisted-inventory";
import {firstAvailableSupplierCatalog} from "@/lib/tours/catalog-selection";
import {WEGOTRIP_CARD_DOCUMENTATION,uniqueSupplierProducts,type SupplierProduct} from "@/lib/tours/supplier-products";
import {tourDiscoveryHref,type ExperiencePath,type TourSearch} from "@/lib/tours/discovery";
import SupplierTourCard from "./SupplierTourCard";
import {getUsdInrReference} from "@/lib/tours/reference-fx";

const FEATURED_PAGE_SIZE=24;

/** Rotate distinct verified cities so one daily import or supplier region cannot monopolize the world catalogue. */
function balancedCities(rows:SupplierProduct[]):SupplierProduct[]{
 const groups=new Map<string,SupplierProduct[]>();
 for(const row of rows){
  const key=row.city.country.toLocaleLowerCase()+":"+row.city.id;
  const group=groups.get(key)??[];
  group.push(row);
  groups.set(key,group);
 }
 const result:SupplierProduct[]=[];
 let remaining=true;
 while(remaining){
  remaining=false;
  for(const group of groups.values()){
   const row=group.shift();
   if(row){result.push(row);remaining=true;}
  }
 }
 return result;
}

export default async function SupplierTourCatalog({search,basePath}:{search:TourSearch;basePath:ExperiencePath}){
 const result=await firstAvailableSupplierCatalog(
  getSupplierCatalog({...search,page:String(search.page)},basePath),
  loadPersistedSupplierProducts(search,basePath),
 );
 const verified=uniqueSupplierProducts(result.items);
 // Default browse is globally diverse, while an explicit city/filter retains supplier order.
 const all=search.city?verified:balancedCities(verified);
 if(search.sort==="price"&&search.currency)all.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
 const pages=Math.max(1,Math.ceil(all.length/FEATURED_PAGE_SIZE));
 const items=all.slice((search.page-1)*FEATURED_PAGE_SIZE,search.page*FEATURED_PAGE_SIZE);
 const indiaUsdProducts=items.some(product=>product.currency==="USD" && product.city.country.toLocaleLowerCase()==="india" && product.price!==null);
 const inrReference=indiaUsdProducts?await getUsdInrReference():null;
 if(!all.length&&(result.status==="invalid"||result.status==="empty"))return null;
 return <section aria-label="Original WeGoTrip products" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
  <h2 className="text-xl font-bold">{basePath==="/tours"?"Original supplier tours":"Supplier tickets and experiences"}</h2>
  {result.status==="unavailable"&&!all.length?<p role="status" className="mt-3 text-sm text-[var(--text-soft)]">The original supplier catalogue is temporarily unavailable. Search independent booking partners below, or try again later.</p>:<>
   <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Verified supplier products{search.city?" for "+search.city:" from India and worldwide"}. Browse a curated selection, not the provider’s complete inventory. New eligible imports become visible without a redeploy. Original photos, listed prices and booking details remain with the supplier.</p>
   {items.length?<div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map(product=><SupplierTourCard key={product.provider+":"+product.id} product={product} inrReference={inrReference}/>)}</div>:
    <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">No additional verified products on this page. Try page one or another city.</p>}
   {pages>1&&<nav aria-label="Supplier tour pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
    <span className="text-[var(--text-soft)]">Page {Math.min(search.page,pages)} of {pages} · verified featured selection</span>
    <span className="flex gap-3">
     {search.page>1&&<a className="gth-btn" href={tourDiscoveryHref(basePath,search,"rail",{page:search.page-1})}>Previous supplier tours</a>}
     {search.page<pages&&<a className="gth-btn" href={tourDiscoveryHref(basePath,search,"rail",{page:search.page+1})}>More supplier tours</a>}
    </span>
   </nav>}
   <p className="mt-3 text-xs text-[var(--text-soft)]">Confirm current availability and prices on each exact product page. <a href={WEGOTRIP_CARD_DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="underline">Supplier API source</a> · <a href="/affiliate-disclosure" className="underline">Affiliate disclosure</a></p>
  </>}
 </section>;
}
