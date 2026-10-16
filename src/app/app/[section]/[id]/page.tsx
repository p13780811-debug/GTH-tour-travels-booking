import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,Building2,CalendarCheck,ClipboardCheck,FileSearch,Globe,Hotel,MapPin,ShieldCheck} from "lucide-react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import {loadAppDetail} from "@/lib/mobile/catalog";
import {isMobileSection} from "@/lib/mobile/routes";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Details | GTH PRO App",robots:{index:false,follow:false}};
type Props={params:Promise<{section:string;id:string}>};
const KindIcon={destination:Globe,hotel:Hotel,property:Building2,tender:FileSearch};
export default async function AppRecordDetail({params}:Props){
 const {section,id}=await params;
 if(!isMobileSection(section)||section==="flights"||id.length>160)notFound();
 const record=await loadAppDetail(section,id);
 if(!record)notFound();
 const Icon=KindIcon[record.kind];
 const sectionUrl="/app/"+section;
 return <main className="min-h-dvh bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <article className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
   <Link href={sectionUrl} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
    <ArrowLeft size={16} aria-hidden="true"/> Back to {section}
   </Link>
   <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    <div className="relative flex h-44 items-center justify-center bg-[var(--bg-soft)] sm:h-52">
     {record.image?<Image src={record.image} fill sizes="(max-width:640px) 100vw,640px"
       alt={record.title} className="object-cover"/>:
      <div className="flex flex-col items-center justify-center gap-3 text-[var(--text-soft)]">
       <Icon size={39} strokeWidth={1.5} className="text-[var(--gold)]"/>
       <span className="text-xs">{record.kind==="hotel"?"No licensed hotel photo":"Public record"}</span>
      </div>}
    </div>
    <div className="p-5">
     <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">GTH PRO · {record.subtitle}</p>
     <h1 className="mt-2 text-xl font-semibold leading-7 tracking-tight">{record.title}</h1>
     <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{record.summary}</p>
     <div className="mt-5 grid grid-cols-2 gap-2">
      {record.facts.map(([key,value])=><div key={key} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
       <p className="text-[11px] font-medium text-[var(--text-soft)]">{key}</p>
       <p className="mt-1 break-words text-xs font-semibold">{value}</p>
      </div>)}
     </div>
     <div className="mt-5 flex flex-col gap-3">
      <Link href={"/app/"+section+"/"+encodeURIComponent(id)+"/prepare"}
        className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        <ClipboardCheck size={16}/> {record.kind==="tender"?"Review tender readiness":
          record.kind==="hotel"?"Plan this stay":record.kind==="property"?"Property review checklist":"Plan this destination"}
      </Link>
      {record.kind==="destination"?<Link href={record.related}
        className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        <MapPin size={16}/> Find local hotel records <ArrowUpRight size={15}/>
       </Link>:null}
      <Link href={record.related} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
        Browse more {record.kind==="tender"?"tenders":record.kind==="property"?"properties":record.kind==="hotel"?"stays":"destinations"}
      </Link>
      {record.source?<a href={record.source} target="_blank" rel="noopener noreferrer nofollow"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
         Official / source record <ArrowUpRight size={15}/>
       </a>:null}
      {record.website?<a href={record.website} target="_blank" rel="noopener noreferrer nofollow"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
         Listed accommodation website <ArrowUpRight size={15}/>
       </a>:null}
      <a href={record.fullSite} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
        Open full website separately <ArrowUpRight size={15}/>
      </a>
     </div>
     <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
       <ShieldCheck size={16} className="mt-1 shrink-0 text-[var(--gold)]"/>
       {record.kind==="hotel"?"Property directory records are not confirmed available rooms or prices. Verify with the property.":
        record.kind==="tender"?"The issuing authority controls final eligibility, documents and bid submission.":
        record.kind==="property"?"Confirm location, ownership, availability, price and project credentials independently.":
         "Editorial travel guide. Confirm schedules, availability and offers with official providers."}
     </p>
    </div>
   </div>
  </article>
 </main>;
}
