import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MarketplaceSectionPhoto from "@/components/mobile/MarketplaceSectionPhoto";
import TravelPackagePlanner from "@/components/travel/TravelPackagePlanner";
export const metadata:Metadata={title:"Travel packages | GTH PRO App",robots:{index:false,follow:false}};
export default function AppPackages(){
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <header className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><MarketplaceSectionPhoto kind="packages"/><h1 className="mt-3 text-2xl font-bold">Travel packages</h1><p className="mt-2 text-sm text-[var(--text-soft)]">Plan flights, hotels, experiences and transfers with the existing GTH PRO planner. Each service is booked independently.</p></header>
  <TravelPackagePlanner/>
 </main>;
}
