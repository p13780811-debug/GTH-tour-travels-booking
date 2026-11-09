"use client";
import dynamic from "next/dynamic";
import {usePathname} from "next/navigation";

// Split the feature chunk: other hotel routes do not download its client code.
const NuiteeHotelOffers=dynamic(()=>import("@/components/hotel/NuiteeHotelOffers"),{ssr:false});
/** Exact-path mount: never adds cards to /hotels/results, /hotels/stay or supplier redirects. */
export default function HotelsDiscoveryPlacement({currency="INR"}:{currency?:string}){
 const pathname=usePathname();
 return pathname==="/hotels"?<NuiteeHotelOffers currency={currency}/>:null;
}
