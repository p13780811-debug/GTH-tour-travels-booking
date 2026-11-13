import type {Metadata} from "next";
import Link from "next/link";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppDashboard from "@/components/mobile/MobileAppDashboard";
import EcosystemHeroCarousel from "@/app/mega-aggregator/EcosystemHeroCarousel";
import {loadMobileDiscovery} from "@/lib/mobile/discovery";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"GTH PRO App",description:"Travel, property, tender and worldwide event ticket discovery in one installable mobile dashboard.",appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"}};
export default async function MobileAppHome(){
 const data=await loadMobileDiscovery();
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <nav aria-label="Super App quick access"
    className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 px-3 pt-3 sm:px-6">
    <Link href="/app/board" className="gth-btn-gold inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-bold sm:text-sm">My Research Desk</Link>
    <Link href="/app/explore" className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-center text-xs font-bold text-[var(--text)] sm:text-sm">All Services</Link>
  </nav>
  {/* The approved Ecosystem photography and native app tools now share one Home. */}
  <EcosystemHeroCarousel embedded/>
  <MobileAppDashboard data={data}/>
 </main>;
}
