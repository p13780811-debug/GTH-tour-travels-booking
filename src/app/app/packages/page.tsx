import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import {ModuleHomeHero,ModuleSearchLink} from "@/components/mobile/LuxuryMarketplace";
import TravelPackagePlanner from "@/components/travel/TravelPackagePlanner";
import {LUXURY_VISUALS} from "@/lib/destinations/visual-media";
export const metadata:Metadata={title:"Travel packages | GTH PRO App",robots:{index:false,follow:false}};
export default function AppPackages(){return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]"><MobileAppHeader/><ModuleHomeHero module="Travel packages" title="Your holiday, beautifully connected." subtitle="Build one itinerary using independently booked stays, flights, experiences and transfers." image={LUXURY_VISUALS.packages} links={[["Stays","/app/hotels"],["Flights","/app/flights"],["Destinations","/app/destinations"]]}><ModuleSearchLink href="#package-builder" label="Start planning your trip" description="Choose dates, travelers and services."/></ModuleHomeHero><div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><h1 className="text-2xl font-bold">Travel packages</h1><a href="#package-builder" className="gth-btn-gold mt-3 inline-flex min-h-11 items-center px-4">Start planning</a></div><TravelPackagePlanner/></main>;}
