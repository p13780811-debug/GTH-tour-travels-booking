import type {Metadata} from "next";
import Link from "next/link";
import {ArrowUpRight,BriefcaseBusiness,Building2,Compass,Hotel,Plane,ShieldCheck} from "lucide-react";
import AppBrandMotion from "@/components/mobile/AppBrandMotion";
import AppInstall from "@/components/mobile/AppInstall";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import {loadMobileDiscovery} from "@/lib/mobile/discovery";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Mobile App | GTH PRO",
 description:"Installable GTH PRO mobile ecosystem. Swipe through destinations, hotels, properties and official tenders.",
 appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"}
};
const shortcuts=[
 {name:"Flights",href:"/app/flights",Icon:Plane},
 {name:"Hotels",href:"/app/hotels",Icon:Hotel},
 {name:"Property",href:"/app/property",Icon:Building2},
 {name:"Tenders",href:"/app/tenders",Icon:BriefcaseBusiness}
] as const;

export default async function MobileAppHome(){
 const data=await loadMobileDiscovery();
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader />

  <section className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6 sm:p-5" aria-labelledby="mobile-app-headline">
   <div className="flex items-center gap-3"><AppBrandMotion/><div className="min-w-0">
   <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">One connected global ecosystem</p>
   <h1 id="mobile-app-headline" className="mt-1.5 text-[clamp(1.35rem,6vw,1.9rem)] font-bold leading-tight tracking-tight">
    Discover more. Scroll less.
   </h1>
   <p className="mt-2 max-w-lg text-xs leading-5 text-[var(--text-soft)]">
    Travel, stays, property and worldwide tenders—all in one mobile hub.
   </p>
   </div></div>
   <div className="mt-3 max-w-sm"><AppInstall /></div>
  </section>

  <nav aria-label="Quick app services" className="mt-3 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
   {shortcuts.map(({name,href,Icon})=><Link key={href} href={href}
    className="gth-glass flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold">
     <Icon size={16} className="text-[var(--gold)]" aria-hidden="true"/>{name}
   </Link>)}
  </nav>

  <div className="mx-auto max-w-6xl">
   <MobileDiscoveryRail kind="destination" heading="Destinations" description="City guides · travel ideas"
    href="/app/destinations" items={data.destinations} appLinks/>
   <MobileDiscoveryRail kind="hotel" heading="Hotel guides" description="Source-backed accommodation directory"
    href="/app/hotels?directory=1" items={data.hotels} appLinks/>
   <MobileDiscoveryRail kind="property" heading="Properties" description="Real projects · source-aware details"
    href="/app/property" items={data.properties} appLinks/>
   <MobileDiscoveryRail kind="tender" heading="Open tenders" description="Published notices · official documents"
    href="/app/tenders" items={data.tenders} appLinks/>
  </div>

  <section className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
   <ShieldCheck size={18} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
   <p>GTH PRO shows published discovery records. Live flight fares, hotel rooms and booking conditions are confirmed by authorized providers. Property and tenders retain their original source disclosures.</p>
  </section>
  <footer className="flex flex-wrap gap-4 px-4 pb-4 pt-6 text-xs text-[var(--text-soft)] sm:px-6">
   <Link href="/affiliate-disclosure" className="underline">Disclosures</Link>
   <Link href="/privacy-policy" className="underline">Privacy</Link>
   <Link href="/terms-and-conditions" className="underline">Terms</Link>
   <Link href="/mega-aggregator" className="inline-flex items-center gap-1 underline"><Compass size={13}/> Website</Link>
  </footer>
 </main>;
}
