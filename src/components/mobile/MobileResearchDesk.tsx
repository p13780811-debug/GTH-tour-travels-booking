"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowUpRight,Bookmark,Trash2} from "lucide-react";
import useAppResearch from "@/components/mobile/useAppResearch";

const labels={destination:"Destinations",hotel:"Hotels & stays",property:"Real Estate",tender:"Tender notices"} as const;
export default function MobileResearchDesk(){
 const {items,remove,clear}=useAppResearch();
 const [confirmClear,setConfirmClear]=useState(false);
 return <div className="mx-auto max-w-3xl px-4 pb-8 pt-4 sm:px-6">
  <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
   <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Your private research desk</p>
   <h1 className="mt-2 text-2xl font-semibold">Everything you saved. One place.</h1>
   <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
    Keep destinations, accommodation records, property projects and tender notices together.
    Saved only on this device; not synced to an account or shared with providers.
   </p>
   <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
    <span role="status" className="text-xs font-semibold text-[var(--gold)]">{items.length} of 24 saved</span>
    <Link href="/app/explore" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--gold)] px-4 text-xs font-semibold">
     Discover more <ArrowUpRight size={16} aria-hidden="true"/>
    </Link>
   </div>
  </header>
  {items.length===0?<div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
   <Bookmark size={32} className="mx-auto text-[var(--gold)]"/>
   <h2 className="mt-3 text-lg font-semibold">Your research starts here</h2>
   <p className="mt-2 text-sm text-[var(--text-soft)]">Explore a record and choose Save. No sign-in required.</p>
   <Link href="/app/explore" className="gth-btn-gold mt-4 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold">Explore GTH PRO</Link>
  </div>:
  <>
   <div className="mt-4 grid gap-3">
    {items.map(entry=><article key={entry.href} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
     <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">{labels[entry.kind]}</p>
      <Link href={entry.href} className="mt-1 block min-h-10 break-words py-1 text-sm font-semibold underline decoration-[var(--border)] underline-offset-4">
       {entry.title} <ArrowUpRight size={14} className="inline" aria-hidden="true"/>
      </Link>
      <p className="mt-1 line-clamp-1 text-xs text-[var(--text-soft)]">{entry.subtitle}</p>
     </div>
     <button type="button" onClick={()=>remove(entry.href)} aria-label={"Remove "+entry.title}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]">
      <Trash2 size={17} aria-hidden="true"/>
     </button>
    </article>)}
   </div>
   <div className="mt-5">
    {!confirmClear?<button type="button" onClick={()=>setConfirmClear(true)} className="min-h-11 text-xs font-semibold underline">Clear saved research</button>:
     <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
      <span>Remove all saved records from this device?</span>
      <button type="button" className="min-h-11 rounded-xl border border-[var(--border)] px-4 font-bold" onClick={()=>{clear();setConfirmClear(false);}}>Remove all</button>
      <button type="button" className="min-h-11 px-3 font-semibold underline" onClick={()=>setConfirmClear(false)}>Cancel</button>
     </div>}
   </div>
  </>}
  <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">
   A saved shortcut is not a reservation, guaranteed price, ownership verification or tender eligibility check.
   Reopen the record to review the latest source and deadlines.
  </p>
 </div>;
}
