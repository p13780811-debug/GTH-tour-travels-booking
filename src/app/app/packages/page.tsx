import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MarketplaceVisual from "@/components/mobile/MarketplaceVisual";
import TravelPackagePlanner from "@/components/travel/TravelPackagePlanner";
export const metadata:Metadata={title:"Travel packages | GTH PRO App",robots:{index:false,follow:false}};
export default function AppPackages(){return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
 <MobileAppHeader/><section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><MarketplaceVisual media="packages" priority/><h1 className="mt-4 text-2xl font-bold">Build your travel package</h1><p className="mt-2 text-sm text-[var(--text-soft)]">Plan independent bookings with the existing GTH PRO itinerary builder.</p></section><TravelPackagePlanner/></main>;}
