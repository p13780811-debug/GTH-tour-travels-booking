"use client";
import {useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

type Result={title:string;summary:string;href:string;source:string;country:string;
 city:string;sector:string;similarity:number};
/** Explicit opt-in. No page-load inference or hidden paid API calls. */
export default function SemanticIntelligenceSearch({country=""}:{country?:string}){
 const [query,setQuery]=useState("");
 const [sector,setSector]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 const [notice,setNotice]=useState("");
 const [loading,setLoading]=useState(false);
 const requestId=useRef(0);
 async function search(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const current=++requestId.current;
  const text=query.normalize("NFKC").trim().slice(0,160);
  if(text.length<3)return;
  setLoading(true);setNotice("");setResults([]);
  try{
   const response=await fetch("/api/intelligence/semantic",{
    method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({query:text,country,sector}),signal:AbortSignal.timeout(22000)
   });
   const payload:unknown=await response.json();
   if(current!==requestId.current)return;
   if(!response.ok||!payload||typeof payload!=="object")throw Error("Search not available");
   const found=(payload as {results?:unknown}).results;
   if(!Array.isArray(found))throw Error("Invalid results");
   const clean=found.filter((item):item is Result=>Boolean(item&&typeof item==="object"&&typeof (item as Record<string,unknown>).href==="string"));
   setResults(clean.slice(0,6));
   if(!clean.length)setNotice("No eligible indexed source matched yet. Use the connected source desks and booking search below; this does not mean the destination or service is unavailable.");
  }catch{
   if(current===requestId.current)setNotice("Semantic search is temporarily unavailable. Source research and booking services below remain accessible.");
  }finally{if(current===requestId.current)setLoading(false);}
 }
 return <section aria-labelledby="gth-semantic-title" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
   <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]"><Sparkles size={16}/> Source-verified semantic discovery</p>
   <h2 id="gth-semantic-title" className="mt-2 text-xl font-semibold sm:text-2xl">Describe your research in natural language</h2>
   <p className="mt-2 text-sm text-[var(--text-soft)]">AI similarity finds original published public sources when indexed. It never invents bookable rooms, issued tenders or available properties. Independent booking search stays accessible below.</p>
   <form onSubmit={search} className="mt-4 flex flex-col gap-3 sm:flex-row">
    <input aria-label="Describe your cross-sector search" value={query} onChange={event=>setQuery(event.target.value.slice(0,160))}
     minLength={3} maxLength={160} required placeholder="e.g. public transport works near historic sites" className="gth-input min-w-0 flex-1" />
    <select aria-label="Filter semantic sector" value={sector} onChange={event=>setSector(event.target.value)} className="gth-input">
     <option value="">All sources</option><option value="property">Verified property registry</option>
     <option value="tender">Published tenders</option><option value="attraction">Mapped attractions</option>
     <option value="hotel_directory">Hotel directory (not rooms)</option>
    </select>
    <button type="submit" disabled={loading||query.trim().length<3} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2">
     <Search size={17}/>{loading?"Matching sources…":"Find sources"}
    </button>
   </form>
   <p className="mt-2 text-xs text-[var(--text-soft)]">{country?"Country filter: "+country+". ":"Worldwide public sources. "}English-language semantic model; original non-English records remain accessible through standard discovery.</p>
   {notice&&<p role="status" className="mt-4 text-sm text-[var(--text-soft)]">{notice}</p>}
   {results.length>0&&<div aria-label="AI matched public sources" className="mt-5 grid gap-3 sm:grid-cols-2">
    {results.map((r,i)=><article key={r.href+"-"+i} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--gold)]">{r.sector.replaceAll("_"," ")} · {r.city||r.country}</p>
      <h3 className="mt-2 font-semibold">{r.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{r.summary}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm"><Link href={r.href} className="font-semibold underline">Open GTH source record</Link>
        {/^https:\/\/[^\s]+$/.test(r.source)&&<a href={r.source} rel="nofollow noopener noreferrer" target="_blank" className="underline">Original source</a>}
      </div>
    </article>)}
   </div>}
 </section>;
}
