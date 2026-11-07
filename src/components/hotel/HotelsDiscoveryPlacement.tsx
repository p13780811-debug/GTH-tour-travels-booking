"use client";
import {usePathname} from "next/navigation";
import NuiteeHotelOffers from "@/components/hotel/NuiteeHotelOffers";

/** Exact-path mount: never adds cards to /hotels/results, /hotels/stay or supplier redirects. */
export default function HotelsDiscoveryPlacement(){
 const pathname=usePathname();
 return pathname==="/hotels"?<NuiteeHotelOffers/>:null;
}
