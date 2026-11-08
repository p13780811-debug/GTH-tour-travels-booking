import type {Metadata} from "next";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import DealsDiscovery from "@/components/travel/DealsDiscovery";
import {activeApprovedKlookPromos} from "@/lib/travel/approved-klook-promos";
export const metadata:Metadata={
 title:"Travel Deals & Offers | GTH PRO",
 description:"Explore global travel experiences and current booking-provider promotions. Verified partner codes appear only with programme approval.",
 alternates:{canonical:"/travel/deals"}
};
export default function TravelDealsPage(){
 return <main><TravelSectionNav/><DealsDiscovery promos={activeApprovedKlookPromos()}/></main>;
}
