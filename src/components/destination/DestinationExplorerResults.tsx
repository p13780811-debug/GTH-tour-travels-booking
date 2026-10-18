"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {ArrowRight, BookOpen, Check, Columns3, GitCompareArrows, Heart, Hotel, LayoutGrid, List, MapPin, Plane, X} from "lucide-react";
import type {DestinationCardInfo} from "@/components/destination/DestinationCard";

const SAVED_KEY="gth-destination-explorer-saved-v1";
const NOTES_KEY="gth-destination-explorer-notes-v1";

type Props={items:DestinationCardInfo[];initialView:"grid"|"list";page:number};

export default function DestinationExplorerResults({items,initialView,page}:Props){
 const [view,setView]=useState<"grid"|"list">(initialView);
 const [saved,setSaved]=useState<string[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [savedOnly,setSavedOnly]=useState(false);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);

 useEffect(()=>{
  try{
   const parsed:unknown=JSON.parse(localStorage.getItem(SAVED_KEY)||"[]");
   if(Array.isArray(parsed))setSaved(parsed.filter((value):value is string=>typeof value==="string"&&/^[a-z-]{1,80}$/.test(value)).slice(0,300));
   const storedNotes:unknown=JSON.parse(localStorage.getItem(NOTES_KEY)||"{}");
   if(storedNotes&&typeof storedNotes==="object"&&!Array.isArray(storedNotes)){
    const safe=Object.fromEntries(Object.entries(storedNotes).filter(([key,value])=>/^[a-z-]{1,80}$/.test(key)&&typeof value==="string").map(([key,value])=>[key,(value as string).slice(0,1500)]));
    setNotes(safe);
   }
  }catch{ /* Browser storage may be unavailable. The public directory still works. */ }
 },[]);

 const shown=savedOnly?items.filter(item=>saved.includes(item.slug)):items;
 const compared=selected.map(slug=>items.find(item=>item.slug===slug)).filter((item):item is DestinationCardInfo=>Boolean(item));
 function updateSaved(slug:string){
  const next=saved.includes(slug)?saved.filter(value=>value!==slug):[...saved,slug];
  setSaved(next);
  try{localStorage.setItem(SAVED_KEY,JSON.stringify(next));}catch{setNotice("Shortlist is available for this visit, but device storage is blocked.");}
 }
 function toggleCompare(slug:string){
  if(selected.includes(slug)){setSelected(old=>old.filter(id=>id!==slug));setNotice("");return;}
  if(selected.length>=3){setNotice("Compare up to three destinations at a time.");return;}
  setSelected(old=>[...old,slug]);setNotice("");
 }
 function changeView(next:"grid"|"list"){
  setView(next);
  const url=new URL(window.location.href);
  if(next==="list")url.searchParams.set("view","list");
  else url.searchParams.delete("view");
  window.history.replaceState(null,"",url.toString());
 }
 function changeNote(slug:string,value:string){
  const next={...notes,[slug]:value.slice(0,1500)};
  setNotes(next);
  try{localStorage.setItem(NOTES_KEY,JSON.stringify(next));}catch{setNotice("Private notes cannot persist because browser storage is blocked.");}
 }
 return <>
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
   <div>
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Destination discovery</p>
    <h3 className="mt-1 text-xl font-bold tracking-tight">Explore places, compare possibilities</h3>
    <p role="status" className="mt-1 text-xs text-[var(--text-soft)]">{shown.length} displayed on page {page} · Directory information, not booking confirmation</p>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <button type="button" aria-pressed={savedOnly} onClick={()=>setSavedOnly(old=>!old)}
      className={"inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold "+(savedOnly?"border-[var(--gold)] bg-[var(--bg)]":"border-[var(--border)] bg-[var(--card)]")}>
      <Heart size={16} fill={savedOnly?"currentColor":"none"}/> Saved on this page ({items.filter(item=>saved.includes(item.slug)).length})
    </button>
    <div role="group" aria-label="Destination listing layout" className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
     <button type="button" aria-pressed={view==="grid"} aria-label="Grid view" onClick={()=>changeView("grid")}
      className={"inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs "+(view==="grid"?"bg-[var(--bg)] font-bold":"text-[var(--text-soft)]")}>
      <LayoutGrid size={16}/> <span className="hidden sm:inline">Grid</span>
     </button>
     <button type="button" aria-pressed={view==="list"} aria-label="List view" onClick={()=>changeView("list")}
      className={"inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs "+(view==="list"?"bg-[var(--bg)] font-bold":"text-[var(--text-soft)]")}>
      <List size={16}/> <span className="hidden sm:inline">List</span>
     </button>
    </div>
   </div>
  </div>
  <p role="status" aria-live="polite" className="mb-3 text-xs text-[var(--text-soft)]">{notice}</p>
  {shown.length===0?(
   <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
    <p className="font-semibold">No saved destinations on this page</p>
    <p className="mt-2 text-sm text-[var(--text-soft)]">Save any destination to keep it in your private shortlist.</p>
    <button className="mt-3 min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm" onClick={()=>setSavedOnly(false)}>Show all results</button>
   </div>
  ):(
   <div className={view==="grid"?"grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3":"flex min-w-0 flex-col gap-4"}>
    {shown.map(item=>{
     const isSaved=saved.includes(item.slug);
     const isCompared=selected.includes(item.slug);
     const isGuide=item.location==="Editorial destination guide";
     return <article key={item.slug} className={"group min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition-shadow hover:shadow-md "+(view==="list"?"flex flex-col sm:flex-row":"flex flex-col")}>
      <Link href={"/destinations/"+encodeURIComponent(item.slug)} aria-label={"Explore "+item.title+" destination guide"}
        className={"relative block shrink-0 overflow-hidden bg-[var(--bg-soft)] "+(view==="list"?"aspect-[16/10] w-full sm:aspect-auto sm:w-[220px]":"aspect-[16/10] w-full")}>
       <Image src={item.image} alt={item.title+" destination illustration"} fill sizes={view==="list"?"(max-width: 640px) 100vw, 220px":"(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.035]"/>
       <span className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-semibold text-white">{isGuide?"Editorial guide":"Destination directory"}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4">
       <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
         <p className="inline-flex max-w-full items-center gap-1 text-[11px] text-[var(--text-soft)]"><MapPin size={13} className="shrink-0"/><span className="truncate">{item.region||"Worldwide"}{item.country?" · "+item.country:""}</span></p>
         <h4 className="mt-1 text-base font-bold tracking-tight sm:text-lg"><Link href={"/destinations/"+encodeURIComponent(item.slug)} className="hover:underline">{item.title}</Link></h4>
        </div>
        <button type="button" aria-pressed={isSaved} aria-label={(isSaved?"Remove ":"Save ")+item.title+" "+(isSaved?"from":"to")+" shortlist"} onClick={()=>updateSaved(item.slug)}
         className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)]" title={isSaved?"Remove from shortlist":"Save destination"}>
         <Heart size={17} fill={isSaved?"currentColor":"none"}/>
        </button>
       </div>
       <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{item.description}</p>
       <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-[var(--border)] px-2.5 py-1">Country: {item.country||"Not recorded"}</span>
        {item.region&&<span className="rounded-full border border-[var(--border)] px-2.5 py-1">{item.region}</span>}
       </div>
       <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <button type="button" aria-pressed={isCompared} onClick={()=>toggleCompare(item.slug)}
         className={"inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold "+(isCompared?"border-[var(--gold)] bg-[var(--bg)]":"border-[var(--border)]")}>
         {isCompared?<Check size={15}/>:<GitCompareArrows size={15}/>} {isCompared?"Comparing":"Compare"}
        </button>
        <Link href={"/destinations/"+encodeURIComponent(item.slug)} className="gth-btn-gold inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-semibold">
         Explore guide <ArrowRight size={15}/>
        </Link>
       </div>
       <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3 text-xs">
        <Link className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4" href={"/hotels/results?city="+encodeURIComponent(item.title)}><Hotel size={13}/> Hotels</Link>
        <Link className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4" href={"/tours?city="+encodeURIComponent(item.slug)}><Columns3 size={13}/> Tours</Link>
        <Link className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4" href="/flights"><Plane size={13}/> Flights</Link>
       </div>
      </div>
     </article>;
    })}
   </div>
  )}
  {compared.length>0&&<div className="sticky bottom-16 z-30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--gold)] bg-[var(--card)] p-3 shadow-lg md:bottom-4">
   <div className="min-w-0">
    <p className="text-sm font-semibold">{compared.length}/3 destinations selected</p>
    <p className="max-w-[240px] truncate text-xs text-[var(--text-soft)] sm:max-w-lg">{compared.map(item=>item.title).join(" · ")}</p>
   </div>
   <div className="flex gap-2">
    <button type="button" className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs" onClick={()=>{setSelected([]);setNotice("");}}>Clear</button>
    <button type="button" onClick={()=>dialog.current?.showModal()} className="gth-btn-gold inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold"><GitCompareArrows size={15}/> Compare</button>
   </div>
  </div>}
  <dialog ref={dialog} aria-label="Compare destination research" className="m-auto max-h-[90dvh] w-[min(94vw,1000px)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 text-[var(--text)] shadow-2xl backdrop:bg-black/70">
   <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-6">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Research workspace</p><h3 className="text-lg font-bold">Compare destination details</h3></div>
    <button type="button" onClick={()=>dialog.current?.close()} aria-label="Close comparison" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]"><X size={18}/></button>
   </div>
   <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto p-4 sm:p-6">
    {compared.map(item=><div key={item.slug} className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
     <h4 className="break-words text-sm font-bold">{item.title}</h4>
     <dl className="mt-3 space-y-3 text-xs">
      <div><dt className="text-[var(--text-soft)]">Country</dt><dd className="mt-1 font-medium">{item.country||"Not recorded"}</dd></div>
      <div><dt className="text-[var(--text-soft)]">Region</dt><dd className="mt-1 font-medium">{item.region||"Not recorded"}</dd></div>
      <div><dt className="text-[var(--text-soft)]">Content type</dt><dd className="mt-1 font-medium">{item.location}</dd></div>
     </dl>
     <label className="mt-4 block text-xs font-medium">My private notes
      <textarea rows={3} maxLength={1500} value={notes[item.slug]||""} onChange={event=>changeNote(item.slug,event.target.value)}
       placeholder="Questions to check before booking" className="mt-2 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs"/>
     </label>
     <Link href={"/destinations/"+encodeURIComponent(item.slug)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-xs font-semibold underline"><BookOpen size={14}/> Open guide</Link>
    </div>)}
   </div>
   <p className="px-4 pb-5 text-xs leading-5 text-[var(--text-soft)] sm:px-6">Private notes stay on this device. Editorial geography and images do not prove accommodation availability, ticket inventory, provider partnership or AI verification.</p>
  </dialog>
 </>;
}
