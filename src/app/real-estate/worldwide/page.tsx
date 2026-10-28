import BottomNav from "@/components/mobile/BottomNav";
import type {Metadata} from "next";
import GlobalGateway from "@/components/real-estate/GlobalGateway";
import RecentlyViewed from "@/components/real-estate/RecentlyViewed";
import JourneyNav from "@/components/real-estate/JourneyNav";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
export const metadata:Metadata={title:'Worldwide property gateway | GTH PRO',description:'Choose a country, search reviewed property inventory, access seller workflows and continue your private property research. Inventory coverage varies by market.',alternates:{canonical:siteUrl('/real-estate/worldwide')},robots:{index:isPublicLaunch(),follow:true}};
export default function WorldwideProperties(){return <main className="gth-container pb-28 pt-8"><JourneyNav/><p className="gold-text mt-5 text-xs uppercase tracking-widest">GTH PRO · Global property journeys</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Your worldwide property gateway</h1><GlobalGateway/><RecentlyViewed/><BottomNav/></main>;}
