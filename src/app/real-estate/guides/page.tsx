import type {Metadata} from "next";
import PillarGuideIndex from "@/components/seo/PillarGuideIndex";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
export const metadata:Metadata={
 title:"Real Estate Research Guides: RERA, Title and Buying | GTH PRO",
 description:"Original property due-diligence guides on MahaRERA, listing verification, title, rent-versus-buy, global purchasing and promoter submissions.",
 alternates:{canonical:siteUrl("/real-estate/guides")},
 robots:{index:isPublicLaunch(),follow:isPublicLaunch()},
};
export default function PropertyResearchGuides(){return <PillarGuideIndex pillar="Real Estate"/>;}
