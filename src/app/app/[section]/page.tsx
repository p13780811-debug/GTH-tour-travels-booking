import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowRight,Building2,FileSearch,Hotel,Plane,ShieldCheck} from "lucide-react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import {loadMobileDiscovery,type MobileDiscoveryKind} from "@/lib/mobile/discovery";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Discover | GTH PRO Mobile",
 description:"Compact GTH PRO app discovery tabs. Open the full marketplace to search live suppliers and official sources.",
 robots:{index:false,follow:false}
};
const sections={
 flights:{heading:"Flights",subtitle:"Search genuine fare observations",full:"/flights",button:"Search flights",railKind:"destination",railTitle:"Places to fly",railDescription:"Explore destinations before searching fares",Icon:Plane},
 hotels:{heading:"Hotels & stays",subtitle:"Browse source-attributed accommodation",full:"/hotels",button:"Search all hotels",railKind:"hotel",railTitle:"Places to stay",railDescription:"Source-backed directory · no unverified room prices",Icon:Hotel},
 property:{heading:"Property",subtitle:"Explore original project records",full:"/real-estate",button:"Search properties",railKind:"property",railTitle:"Property discovery",railDescription:"Published records · confirm current inventory",Icon:Building2},
 tenders:{heading:"Tenders",subtitle:"Research published procurement notices",full:"/tender",button:"Search all tenders",railKind:"tender",railTitle:"Open opportunities",railDescription:"Official-source notices · qualification needs review",Icon:FileSearch}
} as const;

export function generateStaticParams(){
 return Object.keys(sections).map(section=>({section}));
}
export default async function MobileAppSection({params}:{params:Promise<{section:string}>}){
 const {section}=await params;
 if(!(section in sections))notFound();
 const current=sections[section as keyof typeof sections];
 const data=await loadMobileDiscovery();
 const items=current.railKind==="destination"?data.destinations:
   current.railKind==="hotel"?data.hotels:
   current.railKind==="property"?data.properties:data.tenders;
 const kind=current.railKind as MobileDiscoveryKind;
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
   <MobileAppHeader/>
   <section className="mx-4 mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6" aria-labelledby="app-section-heading">
    <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--gold)]">
      <current.Icon size={16} aria-hidden="true"/> GTH PRO · {current.heading}
    </p>
    <h1 id="app-section-heading" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{current.heading}</h1>
    <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{current.subtitle}</p>
    <Link href={current.full} className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold">
      {current.button} <ArrowRight size={15} aria-hidden="true"/>
    </Link>
   </section>
   <div className="mx-auto mt-3 max-w-6xl">
    <MobileDiscoveryRail heading={current.railTitle} description={current.railDescription} href={current.full} items={items} kind={kind}/>
    {section==="flights"?<MobileDiscoveryRail heading="Hotel inspiration" description="Discover available source-backed stay profiles" href="/hotels" items={data.hotels} kind="hotel"/>:null}
    {section==="hotels"?<MobileDiscoveryRail heading="Explore destinations" description="City guides and local travel planning" href="/destinations" items={data.destinations} kind="destination"/>:null}
   </div>
   <p className="mx-4 mt-5 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
     <ShieldCheck size={17} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
     {section==="flights"||section==="hotels"
       ?"Displayed directory data does not guarantee a booked seat or room. Complete searches and confirm prices with authorized providers."
       :"Review all current source records, documents and eligibility before committing or submitting anything."}
   </p>
   <div className="px-4 pt-6">
    <Link href="/app" className="text-xs font-semibold underline">← Back to mobile home</Link>
   </div>
 </main>;
}
