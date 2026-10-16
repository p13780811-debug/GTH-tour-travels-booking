"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,ClipboardCheck,ExternalLink,ShieldCheck} from "lucide-react";

const TASKS={
 hotels:[
  ["dates","Confirm travel dates and number of guests"],
  ["availability","Check actual room availability with the hotel"],
  ["total","Confirm total amount including taxes and fees"],
  ["cancel","Review cancellation and refund rules"],
  ["access","Confirm address, accessibility and check-in"],
 ],
 property:[
  ["title","Verify ownership and official project/registry details"],
  ["visit","Arrange an independent property inspection"],
  ["cost","Confirm actual asking price and all additional fees"],
  ["legal","Review legally required paperwork with a professional"],
  ["agent","Verify seller or authorized agent identity"],
 ],
 tenders:[
  ["notice","Read the latest official notice and corrigenda"],
  ["criteria","Review qualification and exclusions"],
  ["documents","Verify mandatory document templates"],
  ["meeting","Check compulsory pre-bid meeting or site visit"],
  ["deadline","Confirm portal, time zone and final closing time"],
 ],
 destinations:[
  ["entry","Verify entry, visa and passport requirements"],
  ["stay","Explore accommodation source records"],
  ["transport","Check local transport and connections"],
  ["safety","Review official travel advisories"],
  ["timing","Confirm seasonal conditions and opening hours"],
 ]
} as const;
type Kind=keyof typeof TASKS;
export default function MobilePreparation({kind,title,sourceHref,backHref}:{
 kind:Kind;title:string;sourceHref:string|null;backHref:string;
}){
 const entries=TASKS[kind];
 const [reviewed,setReviewed]=useState<string[]>([]);
 const [notes,setNotes]=useState("");
 const total=entries.length;
 return <section className="space-y-4" aria-labelledby="app-workflow-title">
  <div className="flex items-center justify-between gap-3">
   <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
    <ArrowLeft size={16}/> Back to details
   </Link>
   <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold">{reviewed.length}/{total} reviewed</span>
  </div>
  <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
   <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--gold)]">GTH PRO · Mobile preparation</p>
   <h1 id="app-workflow-title" className="mt-2 text-xl font-semibold leading-7">{title}</h1>
   <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
    Short, source-aware checklist. Tick items only after checking them yourself; progress stays in this screen
    and is not a verified booking, property inspection, or tender application.
   </p>
  </header>
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
   <div className="flex items-center gap-2 text-sm font-semibold"><ClipboardCheck size={18} className="text-[var(--gold)]"/> Preparation checklist</div>
   <div role="progressbar" aria-valuenow={reviewed.length} aria-valuemin={0} aria-valuemax={total} aria-label="Review progress"
     className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
    <div className="h-full rounded-full bg-[var(--gold)]" style={{width:(100*reviewed.length/total)+"%"}}/>
   </div>
   <div className="mt-4 grid gap-2">
    {entries.map(([id,label])=><label key={id}
      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm">
      <input type="checkbox" className="size-4 shrink-0 accent-amber-600"
       checked={reviewed.includes(id)}
       onChange={e=>setReviewed(old=>e.target.checked?[...old,id]:old.filter(v=>v!==id))}/>
      <span className="min-w-0 flex-1">{label}</span>
      {reviewed.includes(id)?<CheckCircle2 size={16} className="shrink-0 text-[var(--gold)]"/>:null}
     </label>)}
   </div>
  </div>
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
   <label className="block text-sm font-semibold">Personal notes (this screen only)
     <textarea maxLength={800} rows={3} value={notes} onChange={e=>setNotes(e.target.value)}
      placeholder="Add what you need to verify..."
      className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm font-normal text-[var(--text)]"/>
   </label>
   <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Notes are not sent to a server or saved as an official record.</p>
  </div>
  {sourceHref?<a href={sourceHref} target="_blank" rel="noopener noreferrer nofollow"
    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold">
    Review official/source page <ExternalLink size={16}/>
   </a>:null}
  <p className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={16} className="mt-1 shrink-0 text-[var(--gold)]"/>
   GTH PRO does not automatically submit bids, certify properties, or confirm room reservations through this checklist.</p>
 </section>;
}
