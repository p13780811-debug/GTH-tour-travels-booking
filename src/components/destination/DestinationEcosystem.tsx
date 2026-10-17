import Link from "next/link";
import {
 ArrowRight,BookOpen,BriefcaseBusiness,Building2,Bus,CarFront,ClipboardList,
 Compass,FileText,Hotel,MapPin,Plane,Route,TrainFront,WalletCards,
 type LucideIcon
} from "lucide-react";
import {destinationServices,destinationScopeLabel,type DestinationService} from "@/lib/destinations/ecosystem";
const serviceIcons:Record<string,LucideIcon>={
 hotels:Hotel,flights:Plane,tours:Compass,activities:MapPin,transfers:Route,
 cars:CarFront,bus:Bus,train:TrainFront,guides:BookOpen,blog:FileText,
 properties:Building2,"post-property":Building2,tenders:ClipboardList,
 "tender-assistant":BriefcaseBusiness,"list-hotel":WalletCards,
};
export default function DestinationEcosystem({slug,name,country}:{
 slug:string;name:string;country:string|null;
}){
 const services=destinationServices({slug,name,country});
 const groups=[
  {pillar:"Travel",title:"Travel & experiences",subtitle:"Stay, move and explore with working GTH PRO travel services."},
  {pillar:"Real Estate",title:"Property marketplace",subtitle:"Find published property listings or submit an owner enquiry."},
  {pillar:"Tenders",title:"Tender intelligence",subtitle:"Explore public procurement and eligibility tools by supported jurisdiction."},
 ] as const;
 return <section id="destination-ecosystem" className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
   <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">GTH PRO · Three pillars connected</p>
   <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Everything around {name}</h2>
   <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
    Open the matching service directly. Local search filters are applied only when a provider supports them;
    worldwide services are clearly identified and do not imply confirmed availability in this destination.
   </p>
   {groups.map(group=>{
    const items=services.filter(item=>item.pillar===group.pillar);
    return <section key={group.pillar} className="mt-9" aria-label={group.title}>
     <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div><h3 className="text-lg font-semibold sm:text-xl">{group.title}</h3>
       <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{group.subtitle}</p></div>
      <span className="text-xs text-[var(--text-soft)]">Swipe or scroll <ArrowRight size={14} className="inline"/></span>
     </div>
     <div role="region" aria-label={group.title+" horizontal cards"} tabIndex={0}
       className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
      {items.map((service:DestinationService)=>{
       const Icon=serviceIcons[service.key]||Compass;
       return <Link key={service.key} href={service.href}
         className="group flex h-64 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--text)] transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
         <div className="flex items-center justify-between gap-2">
          <span className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2"><Icon size={20} aria-hidden="true"/></span>
          <ArrowRight size={17} aria-hidden="true" className="text-[var(--text-soft)] transition group-hover:translate-x-1"/>
         </div>
         <h4 className="mt-3 line-clamp-1 text-sm font-semibold">{service.label}</h4>
         <p className="mt-1 line-clamp-1 text-xs text-[var(--text-soft)]">{service.description}</p>
         <p className="mt-auto line-clamp-1 text-xs font-medium text-[var(--text-soft)]">
          {destinationScopeLabel(service.scope,name,country)}
         </p>
       </Link>;
      })}
     </div>
    </section>;
   })}
  </div>
 </section>;
}
