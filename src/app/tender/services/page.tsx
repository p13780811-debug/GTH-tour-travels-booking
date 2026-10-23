import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ClipboardCheck} from "lucide-react";
import TenderServiceForm from "@/components/tender/TenderServiceForm";
import {getPublicTender} from "@/lib/tender/catalog";
import {TENDER_SERVICES,serviceChoice,SERVICE_UUID} from "@/lib/tender/services";
import {SITE_CONFIG} from "@/lib/site-config";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Tender Assistance & Business Service Quotes | GTH PRO",description:"Request a written quote for eligibility review, bid document review, GeM onboarding guidance or tender monitoring.",robots:{index:false,follow:true}};
export default async function TenderServicesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams;
  const initialService=serviceChoice(params.service)??"eligibility_review";
  let tender:{id:string;title:string}|null=null,error="";
  if(params.tenderId){
    if(typeof params.tenderId!=="string"||!SERVICE_UUID.test(params.tenderId))error="This tender reference is invalid.";
    else{
      const result=await getPublicTender(params.tenderId);
      if(!result.ok)error="The selected tender could not be checked. Please retry later.";
      else if(!result.item)error="This tender is no longer available for a service request.";
      else tender={id:result.item.id,title:result.item.title};
    }
  }
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--card)]"><div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 md:py-12">
      <Link href="/tender" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--text-soft)]"><ArrowLeft size={16}/> Tender discovery</Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Business services</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Move your bid preparation forward.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Optional paid assistance for businesses preparing procurement bids. Explore notices and use the preparation assistant for free, or request a quote for a defined service.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/tender/assistant" className="gth-btn inline-flex items-center justify-center gap-2"><ClipboardCheck size={16}/> Open free preparation assistant</Link><a href="#service-request" className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2">Discuss your requirements <ArrowRight size={16}/></a></div>
    </div></section>
    <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-9 sm:px-6 lg:grid-cols-2">
      <div className="min-w-0"><h2 className="text-xl font-semibold">Choose the support you need</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {TENDER_SERVICES.map(service=><article key={service.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><h3 className="text-base font-semibold">{service.name}</h3><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{service.summary}</p><p className="mt-3 text-xs font-semibold text-[var(--gold)]">Fee quoted after scope review</p><Link href={`/tender/services?service=${service.id}${tender?`&tenderId=${tender.id}`:""}#service-request`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Choose {service.name.toLowerCase()} <ArrowRight size={15}/></Link></article>)}
      </div><div className="mt-6 rounded-2xl border border-[var(--border)] p-5"><h2 className="text-base font-semibold">How it works</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-[var(--text-soft)]"><li>Tell us your requirements and preferred timeline.</li><li>Receive a written scope, service fee, applicable taxes and delivery terms after review.</li><li>Accept the terms before work starts. Final bid submission remains your responsibility.</li></ol><p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">These are independent GTH PRO services. Tender fees and EMD are payable only through the issuing authority&apos;s official process. Assistance does not guarantee qualification or a contract award.</p></div></div>
      <div id="service-request" className="min-w-0 scroll-mt-28">{error?<section role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"><h2 className="text-xl font-semibold">Tender unavailable</h2><p className="mt-3 text-sm leading-7">{error}</p><Link href={`/tender/services?service=${initialService}`} className="gth-btn mt-5 inline-flex items-center justify-center">Request a general service review</Link></section>:<TenderServiceForm key={`${initialService}:${tender?.id??"general"}`} initialService={initialService} tender={tender}/>}
        <p className="mt-5 break-words text-sm leading-7 text-[var(--text-soft)]">Questions? <a className="text-[var(--gold)] underline" href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a></p>
      </div>
    </div>
  </main>;
}
