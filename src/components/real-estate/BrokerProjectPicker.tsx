"use client";

import {useEffect,useRef,useState} from "react";
import {Check,Search,BookmarkPlus,BookmarkCheck,X} from "lucide-react";
import {catalogSlugs,MAX_CATALOG_PROJECTS} from "@/lib/real-estate/broker-catalog";
import {normalizeSaved,normalizeSavedTitles,SAVED_KEY,SAVED_TITLES_KEY} from "@/lib/real-estate/saved";
import BrokerVoiceInput from "@/components/real-estate/BrokerVoiceInput";

type Project={slug:string;title:string;city:string;source:"registry"|"listing"|"saved"};
type Source="registry"|"listing";

function publicProject(value:unknown,source:Source):Project|null{
 if(!value||typeof value!=="object")return null;
 const row=value as Record<string,unknown>;
 if(typeof row.slug!=="string"||catalogSlugs(row.slug)[0]!==row.slug||typeof row.title!=="string")return null;
 const title=row.title.trim().slice(0,110);
 if(title.length<2)return null;
 const city=typeof row.city==="string"?row.city.trim().slice(0,70):"";
 return {slug:row.slug,title,city,source};
}
const readable=(slug:string)=>slug.replaceAll(/[-_]+/g," ").replace(/\b\w/g,part=>part.toUpperCase());

/** Searches only on explicit user action; saved shortlist stays on the current device. */
export default function BrokerProjectPicker({selected,onChange}:{selected:string[];onChange:(next:string[])=>void}){
 const [query,setQuery]=useState("");
 const [source,setSource]=useState<Source>("registry");
 const [results,setResults]=useState<Project[]>([]);
 const [saved,setSaved]=useState<Project[]>([]);
 const [showSaved,setShowSaved]=useState(false);
 const [loading,setLoading]=useState(false);
 const [notice,setNotice]=useState("");
 const [labels,setLabels]=useState<Record<string,string>>({});
 const controller=useRef<AbortController|null>(null);

 useEffect(()=>()=>controller.current?.abort(),[]);
 const change=(next:string[])=>{onChange(next);setNotice("");};
 const select=(project:Project)=>{
   if(selected.includes(project.slug)){change(selected.filter(s=>s!==project.slug));return;}
   if(selected.length>=MAX_CATALOG_PROJECTS){setNotice("You can select up to five properties.");return;}
   setLabels(previous=>({...previous,[project.slug]:project.title}));
   change([...selected,project.slug]);
 };
 function loadSaved(){
   controller.current?.abort();controller.current=null;setLoading(false);
   if(showSaved){setShowSaved(false);return;}
   try{
     const slugs=normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY)||"[]")).filter(slug=>catalogSlugs(slug)[0]===slug);
     const names=normalizeSavedTitles(JSON.parse(localStorage.getItem(SAVED_TITLES_KEY)||"{}"));
     setSaved(slugs.map(slug=>({slug,title:names[slug]||readable(slug),city:"",source:"saved"})));
     setLabels(old=>({...names,...old}));
     setShowSaved(true);setResults([]);setNotice("");
   }catch{
     setNotice("Saved projects are not accessible on this device.");setSaved([]);setShowSaved(true);
   }
 }
 async function search(){
   controller.current?.abort();controller.current=null;
   setResults([]);setShowSaved(false);setNotice("");
   const text=query.normalize("NFKC").trim().replace(/\s+/gu," ");
   if(text.length<3||text.length>70||!/^[\p{L}\p{N} .&'’-]+$/u.test(text)){
     setNotice("Enter at least 3 letters from the project name, builder or city.");return;
   }
   const abort=new AbortController();controller.current=abort;setLoading(true);
   const timeout=setTimeout(()=>abort.abort(),15_000);
   try{
     const url=source==="registry"
       ?"/api/real-estate/registry-preview?"+new URLSearchParams({q:text})
       :"/api/real-estate/search?"+new URLSearchParams({query:text,page:"1"});
     const response=await fetch(url,{signal:abort.signal,cache:"no-store"});
     if(!response.ok)throw Error("Public project search unavailable");
     const data:unknown=await response.json();
     if(!data||typeof data!=="object"||!Array.isArray((data as {items?:unknown}).items))throw Error();
     if(abort.signal.aborted||controller.current!==abort)return;
     const list=(data as {items:unknown[]}).items.slice(0,12)
       .map(item=>publicProject(item,source)).filter((item):item is Project=>item!==null);
     setResults([...new Map(list.map(item=>[item.slug,item])).values()]);
     setNotice(list.length?"Select your project from the results below.":"No matching public records. Try a different name or choose the other search category.");
   }catch{
     if(controller.current===abort)setNotice("Project search is temporarily unavailable. Try again or pick from saved properties.");
   }finally{
     clearTimeout(timeout);
     if(controller.current===abort){controller.current=null;setLoading(false);}
   }
 }
 function switchSource(value:Source){
   controller.current?.abort();controller.current=null;setLoading(false);
   setSource(value);setResults([]);setNotice("");
 }
 const visible=showSaved?saved:results;
 return <div className="sm:col-span-2">
   <div className="flex flex-wrap items-center justify-between gap-2">
     <label htmlFor="broker-project-search" className="text-sm font-semibold">Find and select projects</label>
     <span className="text-xs text-[var(--text-soft)]">{selected.length}/{MAX_CATALOG_PROJECTS} selected</span>
   </div>
   <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Just search the project name. No URL or slug required. Choose recorded projects or property listings; availability must be confirmed separately.</p>
   <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={event=>{event.preventDefault();void search();}}>
     <input id="broker-project-search" value={query} maxLength={70} onChange={event=>setQuery(event.target.value)} className="gth-input min-w-0 flex-1" placeholder="e.g. Lodha, New Town, Thane" autoComplete="off"/>
     <select aria-label="Project search category" value={source} onChange={event=>switchSource(event.target.value as Source)} className="gth-input min-h-11 sm:max-w-48">
       <option value="registry">Registered projects</option>
       <option value="listing">Property listings</option>
     </select>
     <button type="submit" disabled={loading} className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"><Search size={16}/>{loading?"Searching…":"Search projects"}</button>
   </form>
   <BrokerVoiceInput onTranscript={text=>{setQuery(text);setResults([]);setNotice("");}}/>
   <button type="button" aria-expanded={showSaved} onClick={loadSaved} className="gth-btn mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><BookmarkPlus size={17}/>Pick from Saved Properties</button>
   {notice&&<p role="status" className="mt-3 text-xs text-[var(--text-soft)]">{notice}</p>}
   {(showSaved||results.length>0)&&<div role="region" aria-label={showSaved?"Saved property choices":"Project search results"} className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
     {visible.length===0&&<p className="p-3 text-xs text-[var(--text-soft)]">No saved properties on this device. Use the heart icon on a property listing, or search by name above.</p>}
     {visible.map(project=><div key={project.slug} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
       <div className="min-w-0">
         <p className="break-words text-sm font-semibold">{project.title}</p>
         <p className="mt-1 text-xs text-[var(--text-soft)]">{project.source==="registry"?"Registry research":project.source==="saved"?"Saved on this device":"Property listing"}{project.city?" · "+project.city:""}</p>
       </div>
       <button type="button" disabled={!selected.includes(project.slug)&&selected.length>=MAX_CATALOG_PROJECTS} aria-pressed={selected.includes(project.slug)} onClick={()=>select(project)} className="gth-btn inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-semibold disabled:opacity-50">
         {selected.includes(project.slug)?<><Check size={15}/>Selected</>:<><BookmarkCheck size={15}/>Select</>}
       </button>
     </div>)}
   </div>}
   {selected.length>0&&<div className="mt-4">
     <p className="text-xs font-semibold text-[var(--text-soft)]">Projects in your QR catalog</p>
     <ul className="mt-2 flex flex-wrap gap-2">{selected.map(slug=><li key={slug} className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
       <span className="max-w-56 truncate text-sm" title={labels[slug]||slug}>{labels[slug]||readable(slug)}</span>
       <button type="button" onClick={()=>change(selected.filter(item=>item!==slug))} className="inline-flex min-h-9 min-w-9 items-center justify-center" aria-label={"Remove "+(labels[slug]||readable(slug))}><X size={16}/></button>
     </li>)}</ul>
   </div>}
 </div>;
}
