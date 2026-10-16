import type {Metadata} from "next";
import {notFound} from "next/navigation";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobilePreparation from "@/components/mobile/MobilePreparation";
import {loadAppDetail} from "@/lib/mobile/catalog";
import {isMobileSection} from "@/lib/mobile/routes";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Preparation | GTH PRO App",robots:{index:false,follow:false}};
type Props={params:Promise<{section:string;id:string}>};

export default async function AppPreparationPage({params}:Props){
 const {section,id}=await params;
 if(!isMobileSection(section)||section==="flights"||id.length>160)notFound();
 const record=await loadAppDetail(section,id);
 if(!record)notFound();
 const kind=record.kind==="destination"?"destinations":record.kind==="hotel"?"hotels":record.kind==="tender"?"tenders":"property";
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(96px+env(safe-area-inset-bottom))] text-[var(--text)]">
   <MobileAppHeader/>
   <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
    <MobilePreparation kind={kind} title={record.title}
     sourceHref={record.source??record.website} backHref={"/app/"+section+"/"+encodeURIComponent(id)}/>
   </div>
  </main>;
}
