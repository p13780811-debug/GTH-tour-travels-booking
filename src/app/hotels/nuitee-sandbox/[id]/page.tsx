import {notFound} from "next/navigation";
import NuiteeHotelDetails from "@/components/hotels/NuiteeHotelDetails";
import {getSandboxHotel} from "@/lib/travel/nuitee-sandbox";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const metadata={title:"Supplier Hotel Details · GTH PRO Sandbox",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(process.env.VERCEL_ENV!=="preview"||process.env.GTH_NUITEE_MODE!=="sandbox"||
   process.env.GTH_NUITEE_SANDBOX_ENABLED!=="true"||!/^[A-Za-z0-9_-]{1,100}$/.test(id))notFound();
 let hotel:Awaited<ReturnType<typeof getSandboxHotel>>=null;
 try{hotel=await getSandboxHotel(id);}catch{notFound();}
 if(!hotel)notFound();
 return <NuiteeHotelDetails hotel={hotel}/>;
}
