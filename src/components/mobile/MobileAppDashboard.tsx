"use client";
import {useId,useState} from "react";
import Link from "next/link";
import {Bookmark,BriefcaseBusiness,Building2,Calculator,CarFront,Compass,FileCheck2,Globe2,Heart,Hotel,LayoutGrid,Plane,Route,Search,ShieldCheck,Smartphone} from "lucide-react";
import AppPromoCarousel from "@/components/mobile/AppPromoCarousel";
import AppInstall from "@/components/mobile/AppInstall";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import {filterAppServices,type AppPillar} from "@/lib/mobile/app-dashboard";
import type {MobileDiscoveryData} from "@/lib/mobile/discovery";
const icons={plane:Plane,hotel:Hotel,building:Building2,briefcase:BriefcaseBusiness,transfer:Route,car:CarFront,compass:Compass,shield:ShieldCheck,globe:Globe2,sim:Smartphone,heart:Heart,calculator:Calculator,bookmark:Bookmark,file:FileCheck2};
const tabs=[{id:"all",name:"All",Icon:LayoutGrid},{id:"travel",name:"Travel",Icon:Plane},{id:"property",name:"Property",Icon:Building2},{id:"tender",name:"Tenders",Icon:BriefcaseBusiness}] as const;
export default function MobileAppDashboard({data}:{data:MobileDiscoveryData}){
 const [pillar,setPillar]=useState<AppPillar>("all"),[query,setQuery]=useState(""),[expanded,setExpanded]=useState(false);
 const id=useId(),services=filterAppServices(pillar,query),shown=query||expanded?services:services.slice(0,8);
 return <div className="mx-auto w-full max-w-6xl">
  <div className="px-4 pt-4 sm:px-6">
   <h1 className="text-xl font-bold tracking-tight">Your world. One app.</h1>
   <label className="mt-3 flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4">
    <Search size={20} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
    <input type="search" value={query} onChange={event=>setQuery(event.target.value.slice(0,70))} maxLength={70} aria-label="Find a service" placeholder="Search flights, hotels, property…" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"/>
   </label>
   <div role="tablist" aria-label="GTH PRO service categories" className="mt-3 grid grid-cols-4 gap-1 border-b border-[var(--border)]">
    {tabs.map(({id:tab,name,Icon},index)=><button key={tab} id={`${id}-${tab}`} type="button" role="tab" aria-selected={pillar===tab} aria-controls={`${id}-panel`} tabIndex={pillar===tab?0:-1}
     onClick={()=>{setPillar(tab);setExpanded(false);}}
     onKeyDown={event=>{let next=index;if(event.key==="ArrowRight")next=(index+1)%tabs.length;else if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=tabs.length-1;else return;event.preventDefault();setPillar(tabs[next].id);setExpanded(false);document.getElementById(`${id}-${tabs[next].id}`)?.focus();}}
     className={`flex min-h-14 flex-col items-center justify-center gap-1 border-b-2 py-2 text-[11px] font-semibold ${pillar===tab?"border-[var(--gold)] text-[var(--text)]":"border-transparent text-[var(--text-soft)]"}`}><Icon size={23} aria-hidden="true"/>{name}</button>)}
   </div>
  </div>
  <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${pillar}`}>
   <section aria-label="App services" className="px-4 pt-2 sm:px-6">
    <div className="flex min-h-11 items-center justify-between gap-3"><h2 className="text-sm font-semibold">{query?"Matching services":"What would you like to do?"}</h2>
     {!query&&services.length>8&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)} className="min-h-11 px-1 text-xs font-semibold text-[var(--gold)]">{expanded?"Show less":"See all"}</button>}
    </div>
    {shown.length?<div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6">
     {shown.map(service=>{const Icon=icons[service.icon];return <Link key={service.id} href={service.href} className="group flex min-h-24 min-w-0 flex-col items-center gap-2 rounded-2xl py-2 text-center focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
      <span className="gth-glass flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-transform duration-200 group-active:scale-95 motion-reduce:transform-none"><Icon size={30} strokeWidth={1.7} className="text-[var(--gold)]" aria-hidden="true"/></span>
      <span className="max-w-full text-[11px] font-semibold leading-4">{service.label}</span>
     </Link>;})}
    </div>:<p role="status" className="py-6 text-sm text-[var(--text-soft)]">No matching service here. Try another category or search term.</p>}
   </section>
   <AppPromoCarousel key={pillar} pillar={pillar}/>
   <div className="mx-4 mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:mx-6"><AppInstall /></div>
   {(pillar==="all"||pillar==="travel")&&<>
    <MobileDiscoveryRail kind="destination" heading="Places to explore" description="Swipe for destination guides" href="/app/destinations" items={data.destinations} appLinks/>
    <MobileDiscoveryRail kind="hotel" heading="Hotel guides" description="Source-backed accommodation directory" href="/app/hotels?directory=1" items={data.hotels} appLinks/>
   </>}
   {(pillar==="all"||pillar==="property")&&<MobileDiscoveryRail kind="property" heading="Property discovery" description="Project records · source-aware details" href="/app/property" items={data.properties} appLinks/>}
   {(pillar==="all"||pillar==="tender")&&<MobileDiscoveryRail kind="tender" heading="Open tenders" description="Published notices · official documents" href="/app/tenders" items={data.tenders} appLinks/>}
  </div>
  <footer className="mx-4 mt-4 border-t border-[var(--border)] py-5 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
   <p>Fares and room availability are confirmed by booking providers. Property records and tender notices retain their source details.</p>
   <div className="mt-3 flex flex-wrap gap-4"><Link href="/affiliate-disclosure" className="underline">Disclosures</Link><Link href="/privacy-policy" className="underline">Privacy</Link><Link href="/terms-and-conditions" className="underline">Terms</Link><Link href="/mega-aggregator" className="underline">Website</Link></div>
  </footer>
 </div>;
}
