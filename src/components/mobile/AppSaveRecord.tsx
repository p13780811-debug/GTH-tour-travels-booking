"use client";
import {Bookmark,BookmarkCheck} from "lucide-react";
import type {ResearchKind} from "@/lib/mobile/research-board";
import useAppResearch from "@/components/mobile/useAppResearch";

export default function AppSaveRecord({kind,href,title,subtitle}:{
 kind:ResearchKind;href:string;title:string;subtitle:string;
}){
 const {items,save,remove,ready}=useAppResearch();
 const saved=items.some(entry=>entry.href===href);
 return <button type="button" disabled={!ready} aria-pressed={saved}
  aria-label={saved?"Remove "+title+" from Research Desk":"Save "+title+" to Research Desk"}
  title={saved?"Remove from Research Desk":"Save for later"}
  onClick={()=>saved?remove(href):save({kind,href,title,subtitle})}
  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--gold)] disabled:opacity-50">
  {saved?<BookmarkCheck size={17} className="text-[var(--gold)]" aria-hidden="true"/>:
   <Bookmark size={17} className="text-[var(--gold)]" aria-hidden="true"/>}
  {saved?"Saved":"Save"}
 </button>;
}
