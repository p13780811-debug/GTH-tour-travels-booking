import type {Metadata} from "next";
import MegaAggregator from "@/app/mega-aggregator/page";

/**
 * Mobile PWA-only route for the bottom Home tab.
 * Reuses the approved Ecosystem page verbatim without sending installed PWA
 * users outside its /app scope. The public website homepage "/" is unchanged.
 */
export const revalidate=3600;
export const metadata:Metadata={
 title:"GTH PRO Ecosystem | Mobile App",
 description:"Explore the existing GTH PRO Travel, Real Estate and Tender ecosystem.",
 robots:{index:false,follow:false},
};
export default function MobileEcosystemHome(){
 return <MegaAggregator/>;
}
