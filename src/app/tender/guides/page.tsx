import type {Metadata} from "next";
import PillarGuideIndex from "@/components/seo/PillarGuideIndex";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
export const metadata:Metadata={
 title:"Tender Guides: Eligibility, EMD and Procurement | GTH PRO",
 description:"Source-aware research articles on GeM, CPPP, bidder prequalification, EMD, RFP responses, amendments and international tenders.",
 alternates:{canonical:siteUrl("/tender/guides")},
 robots:{index:isPublicLaunch(),follow:isPublicLaunch()},
};
export default function TenderResearchGuides(){return <PillarGuideIndex pillar="Tenders"/>;}
