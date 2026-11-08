"use client";
import {useState} from "react";
import Link from "next/link";
import {TENDER_SERVICES,type TenderServiceId} from "@/lib/tender/services";
const goals:Array<{id:TenderServiceId;label:string}>=[{id:"eligibility_review",label:"Understand qualification gaps"},{id:"document_review",label:"Review my bid documents"},{id:"gem_onboarding",label:"Prepare for GeM onboarding"},{id:"tender_monitoring",label:"Research opportunities regularly"}];
export default function TenderSupportChooser({tenderId}:{tenderId?:string}){
 const [selected,setSelected]=useState<TenderServiceId>("eligibility_review");
 const service=TENDER_SERVICES.find(row=>row.id===selected)!;
 return <section aria-labelledby="support-choice" className="mb-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">Choose your next step</p><h2 id="support-choice" className="mt-3 text-xl font-semibold">Self-serve tools or a defined service?</h2>
  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Search, shortlist, compare and prepare with the free tools. If you need human assistance, choose a clear deliverable and request its written scope and fee.</p>
  <div className="mt-4 grid gap-2 sm:grid-cols-2">{goals.map(goal=><button type="button" key={goal.id} aria-pressed={selected===goal.id} onClick={()=>setSelected(goal.id)} className={"min-h-12 rounded-xl border px-4 py-3 text-start text-sm "+(selected===goal.id?"border-[var(--gold)] bg-[var(--bg-soft)] font-semibold":"border-[var(--border)] bg-[var(--bg)]")}>{goal.label}</button>)}</div>
  <div aria-live="polite" className="mt-5"><h3 className="font-semibold">{service.name}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{service.deliverable}</p></div>
  <div className="mt-4 flex flex-wrap gap-3"><Link href={`/tender/services?service=${selected}${tenderId?`&tenderId=${tenderId}`:""}#service-request`} prefetch={false} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center justify-center">Request this service quote</Link><Link href={tenderId?`/tender/assistant?tenderId=${tenderId}`:"/tender/assistant"} className="gth-btn inline-flex min-h-11 items-center justify-center">Continue with the free assistant</Link></div>
  <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Optional paid service · fees confirmed before work starts · no promise of eligibility or a contract award.</p>
 </section>;
}
