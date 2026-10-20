import {notFound} from "next/navigation";
import NuiteeHotelDetails from "@/components/hotels/NuiteeHotelDetails";
import {resolvePreviewHotel} from "@/lib/travel/hotel-signature-preview";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const metadata={title:"GTH PRO Signature Stays · Hotel Preview",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){
 if(process.env.VERCEL_ENV!=="preview" || process.env.GTH_NUITEE_MODE!=="sandbox" ||
 process.env.GTH_NUITEE_SANDBOX_ENABLED!=="true")notFound();
 const {slug}=await params;
 let hotel:Awaited<ReturnType<typeof resolvePreviewHotel>>=null;
 try{hotel=await resolvePreviewHotel(slug);}catch{notFound();}
 if(!hotel)notFound();
 return <NuiteeHotelDetails hotel={hotel}/>;
}
