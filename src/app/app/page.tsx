import {DestinationInspirationRail,MarketplaceServices} from "@/components/mobile/LuxuryMarketplace";
import type {Metadata} from "next";
import {Suspense} from "react";
import Link from "next/link";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppDashboard from "@/components/mobile/MobileAppDashboard";
import AppInstall from "@/components/mobile/AppInstall";
import AppResearchQuickAccess from "@/components/mobile/AppResearchQuickAccess";
import EcosystemHeroCarousel from "@/app/mega-aggregator/EcosystemHeroCarousel";
import EcosystemUnifiedSearch from "@/app/mega-aggregator/EcosystemUnifiedSearch";
import EcosystemPillars from "@/components/sections/EcosystemPillars";
import MobileSupplierShowcase from "@/components/mobile/MobileSupplierShowcase";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"GTH PRO Home | Global Technical Hub",
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
  <section data-app-hero-shell="true" className="mx-auto w-full max-w-7xl rounded-b-[2rem] border-b border-[var(--border)] bg-[var(--bg-soft)] pb-6 sm:rounded-b-3xl">
   <div className="px-4 pt-3 sm:px-6 sm:pt-6">
    <p className="sr-only">GTH PRO · Global Technical Hub</p>
    <h1 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">GTH PRO Home</h1>
    <p className="mt-1 max-w-2xl text-[clamp(1.65rem,6.4vw,3.25rem)] font-bold leading-[1.12] tracking-tight text-[var(--text)]">Your world. One global marketplace.</p>
    <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Travel, real estate, tenders and worldwide events. All connected.</p>
    <nav aria-label="Quick marketplace access" className="mt-3 grid grid-cols-4 gap-1.5 sm:max-w-xl sm:gap-3">
     {[
      ["Travel","/travel"],
      ["Real estate","/app/property"],
      ["Tenders","/app/tenders"],
      ["Tickets","/app/services/tickets"],
     ].map(([label,href])=><Link key={href} href={href} prefetch={false} className="flex min-h-11 min-w-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-1 text-center text-[11px] font-semibold leading-tight text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--gold)] sm:px-3 sm:text-sm">{label}</Link>)}
    </nav>
   </div>
   <EcosystemHeroCarousel embedded/>
  </section>
  <div data-app-floating-search="true" className="relative z-10 mx-auto -mt-14 w-full max-w-4xl px-4 sm:-mt-16 sm:px-8">
   <EcosystemUnifiedSearch appHome/>
  </div>
  <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
   <nav aria-label="GTH PRO Home and Research Desk shortcuts" className="grid grid-cols-2 gap-2 sm:max-w-xl sm:gap-3">
    <Link href="/app/explore" prefetch={false} className="gth-btn-gold inline-flex min-h-12 min-w-0 items-center justify-center rounded-xl px-2 py-3 text-center text-xs font-bold sm:text-sm">Explore All Services</Link>
    <Link href="/app/board" prefetch={false} className="gth-btn inline-flex min-h-12 min-w-0 items-center justify-center rounded-xl border border-[var(--border)] px-2 py-3 text-center text-xs font-bold sm:text-sm">My Research Desk</Link>
   </nav>
  </div>
  <EcosystemPillars appHome/>
  <MarketplaceServices/>
  <DestinationInspirationRail/>
  <AppResearchQuickAccess/>
  <div className="mx-auto max-w-7xl px-4 sm:px-6"><a href="/" className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--text-soft)] underline">Website homepage</a></div>
  <section aria-label="Install GTH PRO on your device" className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6">
   <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
    <AppInstall/>
   </div>
  </section>
  <Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 py-4 text-sm text-[var(--text-soft)]">Loading supplier-powered hotel and tour cards…</p>}>
   <MobileSupplierShowcase/>
  </Suspense>
  <section aria-label="Personal favourites and app tools" className="mx-auto max-w-7xl">
   <MobileAppDashboard mode="tools" compactHome/>
  </section>
 </main>;
}
