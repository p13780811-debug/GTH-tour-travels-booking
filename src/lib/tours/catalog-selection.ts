import type {SupplierCatalog} from "./supplier-catalog";
import {uniqueSupplierProducts,type SupplierProduct} from "./supplier-products";

type CatalogResult=SupplierCatalog;
type SourceSelection={value:CatalogResult; source:"live"|"saved"};

function unavailable():CatalogResult{return {items:[],status:"unavailable"};}
function fromSaved(items:SupplierProduct[]):CatalogResult{
 return {items,status:items.length?"ready":"empty"};
}

/** Bound each dependency, including promises that never settle, and contain rejected reads. */
async function bounded<T>(source:Promise<T>,ms:number,fallback:T):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  return await Promise.race([source.catch(()=>fallback),new Promise<T>(resolve=>{
   timer=setTimeout(()=>resolve(fallback),ms);
  })]);
 }finally{if(timer!==undefined)clearTimeout(timer);}
}

/**
 * Merge public validated supplier products with RLS-visible imported inventory.
 *
 * Previously Promise.any() returned the first nonempty result. A fast live Mumbai
 * product could permanently hide *all* distinct Supabase imports on every request.
 * The second source now receives a bounded grace window: fresh imports appear on
 * the next dynamic render without rebuilding or redeploying the application.
 * A stalled provider cannot hold the route indefinitely.
 */
export async function firstAvailableSupplierCatalog(
 live:Promise<SupplierCatalog>, saved:Promise<SupplierProduct[]>,
):Promise<SupplierCatalog>{
 const liveRead=bounded(live,17_000,unavailable());
 const savedRead=bounded(saved,5_000,[]).then(fromSaved);
 const first=await Promise.race<SourceSelection>([
  liveRead.then(value=>({source:"live" as const,value})),
  savedRead.then(value=>({source:"saved" as const,value})),
 ]);
 const other=first.source==="live"?savedRead:liveRead;
 // A truly empty first source must wait for the other (up to its own deadline).
 if(!first.value.items.length){
  const second=await other;
  if(!second.items.length)return {
   items:[],status: first.value.status==="unavailable"||second.status==="unavailable"?"unavailable":
    first.value.status==="invalid"||second.status==="invalid"?"invalid":"empty",
  };
  return second;
 }
 // Do not lose valid records from the second source just because the first was fast.
 // A late/failed source cannot create the 300-second streaming stall we recovered.
 let timer:ReturnType<typeof setTimeout>|undefined;
 let second:CatalogResult;
 try{
  second=await Promise.race([other,new Promise<CatalogResult>(resolve=>{
   timer=setTimeout(()=>resolve({items:[],status:"empty"}),first.source==="live"?5_200:9_000);
  })]);
 }finally{if(timer!==undefined)clearTimeout(timer);}
 const liveItems=first.source==="live"?first.value.items:second.items;
 const savedItems=first.source==="saved"?first.value.items:second.items;
 // Prefer database-imported, still-verified entries when the identities overlap.
 const merged=uniqueSupplierProducts([...savedItems,...liveItems]);
 return {items:merged,status:"ready"};
}
