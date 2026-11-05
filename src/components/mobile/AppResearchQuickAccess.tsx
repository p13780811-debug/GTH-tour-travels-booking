"use client";
import Link from "next/link";
import {ArrowUpRight,BookmarkCheck,Compass} from "lucide-react";
import useAppResearch from "@/components/mobile/useAppResearch";

/** First-class continuation without inventing account sync or saved records. */
export default function AppResearchQuickAccess(){
 const {items,ready}=useAppResearch();
 return <section aria-label="Continue your research" className="mx-4 mt-3 sm:mx-6">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
   <div className="flex min-w-0 items-center gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--gold)]">
     {items.length?<BookmarkCheck size={21} aria-hidden="true"/>:<Compass size={21} aria-hidden="true"/>}
    </span>
    <div className="min-w-0">
     <h2 className="text-xs font-bold">{ready&&items.length?"Pick up your research":"Made personal, by you"}</h2>
     <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-soft)]">
      {ready&&items.length?`${items.length} saved ${items.length===1?"record":"records"} on this device`:"Save discoveries from any GTH PRO service."}
     </p>
    </div>
   </div>
   <Link href="/app/board" className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-bold text-[var(--gold)]">
    My desk <ArrowUpRight size={15} aria-hidden="true"/>
   </Link>
   {ready&&items.length>0&&<div className="flex w-full gap-2 overflow-x-auto border-t border-[var(--border)] pt-2">
    {items.slice(0,3).map(item=><Link key={item.href} href={item.href}
      className="inline-flex min-h-10 max-w-[220px] shrink-0 items-center gap-1 truncate rounded-full bg-[var(--bg-soft)] px-3 text-xs font-semibold">
      <span className="truncate">{item.title}</span><ArrowUpRight size={13} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
    </Link>)}
   </div>}
  </div>
 </section>;
}
