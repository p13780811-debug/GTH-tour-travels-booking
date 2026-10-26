import type {SupplierCatalog} from "./supplier-catalog";
import type {SupplierProduct} from "./supplier-products";

/** A healthy source must not wait for an unrelated slow or unavailable source. */
export async function firstAvailableSupplierCatalog(
 live:Promise<SupplierCatalog>, saved:Promise<SupplierProduct[]>,
):Promise<SupplierCatalog>{
 const results:SupplierCatalog[]=[];
 const candidate=async(source:Promise<SupplierCatalog>,budget:number)=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const result=await Promise.race([source,new Promise<SupplierCatalog>(resolve=>{
    timer=setTimeout(()=>resolve({items:[],status:"unavailable"}),budget);
   })]);
   results.push(result);
   if(result.items.length)return result;
  }catch{
   results.push({items:[],status:"unavailable"});
  }finally{
   clearTimeout(timer);
  }
  throw new Error("No supplier selection");
 };
 try{
  return await Promise.any([
   candidate(live,20_000),
   candidate(saved.then(items=>({items,status:items.length?"ready":"empty"})),5_000),
  ]);
 }catch{
  return {items:[],status:results.some(result=>result.status==="unavailable")?"unavailable":
   results.some(result=>result.status==="invalid")?"invalid":"empty"};
 }
}
