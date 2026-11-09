"use client";
import dynamic from "next/dynamic";
import {usePathname} from "next/navigation";
import {useState} from "react";
import NearbyHotelDiscovery from "./NearbyHotelDiscovery";

// Split the feature chunk: other hotel routes do not download its client code.
const NuiteeHotelOffers=dynamic(()=>import("@/components/hotel/NuiteeHotelOffers"),{ssr:false});
/** Exact-path mount: never adds cards to /hotels/results, /hotels/stay or supplier redirects. */
export default function HotelsDiscoveryPlacement({currency="INR",showNearby=true}:{currency?:string;showNearby?:boolean}){
 const pathname=usePathname();
 const [country,setCountry]=useState("");
 return pathname==="/hotels"?<>{showNearby&&<NearbyHotelDiscovery currency={currency} onCountry={setCountry}/>}<NuiteeHotelOffers currency={currency} preferredCountry={country}/></>:null;
}
