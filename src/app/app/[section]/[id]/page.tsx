import type {Metadata} from "next";
import DiscoveryCardPhoto from "@/components/destination/DiscoveryCardPhoto";
import {destinationServicePhoto,destinationVisual} from "@/lib/destinations/visual-media";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,CalendarCheck,ClipboardCheck,MapPin,ShieldCheck} from "lucide-react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import {loadAppDetail} from "@/lib/mobile/catalog";
import EnquiryForm from "@/components/real-estate/EnquiryForm";
import AppSaveRecord from "@/components/mobile/AppSaveRecord";
import {isMobileSection} from "@/lib/mobile/routes";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Details | GTH PRO App",robots:{index:false,follow:false}};
type Props={params:Promise<{section:string;id:string}>};
export default async function AppRecordDetail({params}:Props){
 const {section,id}=await params;
 if(!isMobileSection(section)||section==="flights"||id.length>160)notFound();
 const record=await loadAppDetail(section,id);
 if(!record)notFound();
 const sectionUrl="/app/"+section;
 return <main className="min-h-dvh bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <article className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
   <Link href={sectionUrl} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
    <ArrowLeft size={16} aria-hidden="true"/> Back to {section}
   </Link>
   <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    <div className="relative flex h-44 items-center justify-center bg-[var(--bg-soft)] sm:h-52">
     <DiscoveryCardPhoto source={record.kind==="destination"?destinationVisual(id,record.countryCode,record.image):record.image} fallback={destinationServicePhoto(record.kind==="destination"?"packages":record.kind==="hotel"?"hotels":record.kind==="property"?"properties":"tenders")} title={record.title}/>
     {!record.image&&record.kind==="hotel"&&<span className="sr-only">No licensed hotel photo</span>}
    </div>
    <div className="p-5">
     <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">GTH PRO · {record.subtitle}</p>
     <h1 className="mt-2 text-xl font-semibold leading-7 tracking-tight">{record.title}</h1>
     <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{record.summary}</p>
     <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <AppSaveRecord kind={record.kind} href={"/app/"+section+"/"+id}
       title={record.title} subtitle={record.subtitle}/>
      <Link href="/app/board" className="inline-flex min-h-11 items-center text-xs font-semibold text-[var(--gold)] underline">
       My Research Desk
      </Link>
     </div>
     <div className="mt-5 grid grid-cols-2 gap-2">
      {record.facts.map(([key,value])=><div key={key} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
       <p className="text-[11px] font-medium text-[var(--text-soft)]">{key}</p>
       <p className="mt-1 break-words text-xs font-semibold">{value}</p>
      </div>)}
     </div>
     {record.propertyEnquiry&&<section aria-labelledby="property-enquiry" className="mt-5">
       <h2 id="property-enquiry" className="mb-2 text-base font-semibold">
         {record.propertyEnquiry.mode==="registry"?"Request current project information":"Enquire about this property"}
       </h2>
       <EnquiryForm propertyId={record.propertyEnquiry.id} mode={record.propertyEnquiry.mode}/>
     </section>}
     <div className="mt-5 flex flex-col gap-3">
      <Link href={"/app/"+section+"/"+encodeURIComponent(id)+"/prepare"}
        className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        <ClipboardCheck size={16}/> {record.kind==="tender"?"Review tender readiness":
          record.kind==="hotel"?"Plan this stay":record.kind==="property"?"Property review checklist":"Plan this destination"}
      </Link>
      {record.kind==="tender"&&<Link href={`/app/tenders/quote?tenderId=${encodeURIComponent(id)}`}
        className="gth-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        Request a quote for this tender <ArrowUpRight size={15} aria-hidden="true"/>
      </Link>}
      {record.kind==="destination"?<Link href={record.related}
        className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        <MapPin size={16}/> Find stays in {record.title} <ArrowUpRight size={15}/>
       </Link>:null}
      {record.kind==="destination"&&<Link prefetch={false} href={"/app/packages?"+new URLSearchParams({city:record.title,...(record.countryCode?{country:record.countryCode}:{})})+"#package-builder"} className="gth-btn inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold">Plan flights, stays & experiences</Link>}
      <Link href={record.kind==="destination"?"/app/destinations":record.related} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
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
