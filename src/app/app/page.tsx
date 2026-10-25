import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppDashboard from "@/components/mobile/MobileAppDashboard";
import {loadMobileDiscovery} from "@/lib/mobile/discovery";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"GTH PRO App",description:"Travel, property and tender services in one installable mobile dashboard.",appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"}};
export default async function MobileAppHome(){
 const data=await loadMobileDiscovery();
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <MobileAppDashboard data={data}/>
 </main>;
}
