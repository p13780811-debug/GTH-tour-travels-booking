import { unstable_cache } from "next/cache";
import NuiteeSandboxExplorer from "@/components/hotels/NuiteeSandboxExplorer";
import { getSandboxHotel, listSandboxHotels } from "@/lib/travel/nuitee-sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type SupplierHotel = NonNullable<Awaited<ReturnType<typeof getSandboxHotel>>>;
const getPreview = unstable_cache(async () => {
 const result=await listSandboxHotels("IN","Mumbai",8,0);
 const hotels=await Promise.all(result.data.map(async (h):Promise<SupplierHotel>=>{
   try{return await getSandboxHotel(h.supplierHotelId) ?? h;}catch{return h;}
 }));
 return {hotels,checkedAt:new Date().toISOString()};
},["gth-nuitee-sandbox-mumbai-visual-v1"],{revalidate:3600});

export default async function NuiteePreview(){
 if(process.env.VERCEL_ENV!=="preview" || process.env.GTH_NUITEE_MODE!=="sandbox" ||
    process.env.GTH_NUITEE_SANDBOX_ENABLED!=="true")return <main className="p-8">Sandbox preview unavailable.</main>;
 try {
  const data=await getPreview();
  return <NuiteeSandboxExplorer initialHotels={data.hotels} checkedAt={data.checkedAt}/>;
 } catch {
  return <NuiteeSandboxExplorer initialHotels={[]} checkedAt={null}/>;
 }
}
