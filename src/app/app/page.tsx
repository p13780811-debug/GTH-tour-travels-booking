import type {Metadata} from "next";
import Link from "next/link";
import {Suspense} from "react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppDashboard from "@/components/mobile/MobileAppDashboard";
import AppInstall from "@/components/mobile/AppInstall";
import AppResearchQuickAccess from "@/components/mobile/AppResearchQuickAccess";
import EcosystemHeroCarousel from "@/app/mega-aggregator/EcosystemHeroCarousel";
import EcosystemUnifiedSearch from "@/app/mega-aggregator/EcosystemUnifiedSearch";
import EcosystemHub from "@/app/mega-aggregator/EcosystemHub";
import EcosystemPillars from "@/components/sections/EcosystemPillars";
import MobileSupplierShowcase from "@/components/mobile/MobileSupplierShowcase";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"GTH PRO Home | Super App",
 description:"GTH PRO Home: travel, hotel bookings, original tours and activities, real estate, tenders, tickets and your private Research Desk.",
 robots:{index:false,follow:false},
 appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"},
};

/** The public website flagship remains /; this is the single installed-app Home.
 * Reuse approved presentation and search components, not a second theme or data source.
 * Live supplier products stream separately so a provider delay never blocks tools.
 */
export default function MobileAppHome(){
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
   <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">Global Technical Hub · Super App</p>
   <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">GTH PRO Home</h1>
   <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Travel, stays, experiences, property, tenders and tickets. Everything in one place.</p>
  </div>
  <EcosystemHeroCarousel embedded/>
  <div className="relative z-10 mx-auto -mt-3 w-full max-w-7xl px-3 pt-2 sm:-mt-4 sm:px-6">
   <EcosystemUnifiedSearch appHome/>
  </div>
  <nav aria-label="Super App quick access" className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-2 gap-2 px-3 sm:px-6">
   <Link href="/app/board" className="gth-btn-gold inline-flex min-h-12 items-center justify-center rounded-xl px-2 py-3 text-center text-xs font-bold sm:text-sm">My Research Desk</Link>
   <Link href="/app/explore" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-2 py-3 text-center text-xs font-bold text-[var(--text)] sm:text-sm">All Services</Link>
  </nav>
  <AppResearchQuickAccess/>
  <section aria-label="Install GTH PRO on your device" className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6">
   <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
    <AppInstall/>
   </div>
  </section>
  <EcosystemPillars appHome/>
  <Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 py-4 text-sm text-[var(--text-soft)]">Loading supplier-powered hotel and tour cards…</p>}>
   <MobileSupplierShowcase/>
  </Suspense>
  <EcosystemHub appHome/>
  <section aria-label="Personal favourites and app tools" className="mx-auto max-w-7xl">
   <MobileAppDashboard mode="tools"/>
  </section>
 </main>;
}
