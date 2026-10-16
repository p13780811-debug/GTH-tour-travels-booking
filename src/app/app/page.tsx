import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,BriefcaseBusiness,Building2,Compass,Hotel,Plane,ShieldCheck} from "lucide-react";
import AppInstall from "@/components/mobile/AppInstall";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import {loadMobileDiscovery} from "@/lib/mobile/discovery";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Mobile App | GTH PRO",
 description:"Installable GTH PRO mobile ecosystem. Swipe through destinations, hotels, properties and official tenders.",
 appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"}
};
const shortcuts=[
 {name:"Flights",href:"/flights",Icon:Plane},
 {name:"Hotels",href:"/hotels",Icon:Hotel},
 {name:"Property",href:"/real-estate",Icon:Building2},
 {name:"Tenders",href:"/tender",Icon:BriefcaseBusiness}
] as const;

export default async function MobileAppHome(){
 const data=await loadMobileDiscovery();
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2 backdrop-blur-xl sm:px-6">
   <Link href="/app" aria-label="GTH PRO Home" className="flex min-w-0 items-center gap-2.5">
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
      <Image src="/images/gth-logo.png" alt="GTH PRO official logo" fill sizes="44px" className="object-contain" priority/>
    </span>
    <span className="min-w-0 leading-tight">
     <strong className="block text-base font-bold tracking-tight">GTH <span className="gold-text">PRO</span></strong>
     <span className="block text-[10px] tracking-wide text-[var(--text-soft)]">Global Technical Hub</span>
    </span>
   </Link>
   <Link href="/mega-aggregator" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
    Explore <ArrowUpRight size={15} aria-hidden="true"/>
   </Link>
  </header>

  <section className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6 sm:p-5" aria-labelledby="mobile-app-headline">
   <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">One connected global ecosystem</p>
   <h1 id="mobile-app-headline" className="mt-1.5 text-[clamp(1.35rem,6vw,1.9rem)] font-bold leading-tight tracking-tight">
    Discover more. Scroll less.
   </h1>
   <p className="mt-2 max-w-lg text-xs leading-5 text-[var(--text-soft)]">
    Travel, stays, property and worldwide tenders—all in one mobile hub.
   </p>
   <div className="mt-3 max-w-sm"><AppInstall/></div>
  </section>

  <nav aria-label="Quick app services" className="mt-3 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
   {shortcuts.map(({name,href,Icon})=><Link key={href} href={href}
    className="gth-glass flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--border)] px-3.5 text-xs font-semibold">
     <Icon size={16} className="text-[var(--gold)]" aria-hidden="true"/>{name}
   </Link>)}
  </nav>

  <div className="mx-auto max-w-6xl">
   <MobileDiscoveryRail kind="destination" heading="Destinations" description="City guides · travel ideas"
    href="/destinations" items={data.destinations}/>
   <MobileDiscoveryRail kind="hotel" heading="Hotels & stays" description="Source-backed accommodation · no invented prices"
    href="/hotels" items={data.hotels}/>
   <MobileDiscoveryRail kind="property" heading="Properties" description="Real projects · source-aware details"
    href="/real-estate" items={data.properties}/>
   <MobileDiscoveryRail kind="tender" heading="Open tenders" description="Published notices · official documents"
    href="/tender" items={data.tenders}/>
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
