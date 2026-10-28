"use client";
import {useEffect,useRef,useState} from "react";
import SavePropertyButton from "@/components/real-estate/SavePropertyButton";
import {normalizeRegistrySelection,REGISTRY_COMPARE_KEY} from "@/lib/real-estate/registry-search";
import Link from "next/link";
import {known} from "@/lib/real-estate/explorer";
import {officialMahaReraUrl} from "./explorer-presentation";

export type ReraProjectRow={
 slug:string;title:string;rera_id?:string|null;developer?:string|null;
 builder_name?:string|null;city?:string|null;district?:string|null;
 completion_date?:string|null;official_source_url?:string|null;
};

export default function RegistryTable({rows,caption="Recorded MahaRERA projects"}:{
 rows:readonly ReraProjectRow[];caption?:string
}){
 const [selected,setSelected]=useState<string[]>([]),[message,setMessage]=useState("");const sessionOnly=useRef(false);
 useEffect(()=>{const load=()=>{if(sessionOnly.current)return;try{setSelected(normalizeRegistrySelection(JSON.parse(localStorage.getItem(REGISTRY_COMPARE_KEY)||"[]")));}catch{setMessage("Device storage unavailable; comparison stays in this page.");}};const sync=(event:StorageEvent)=>{if(!event.key||event.key===REGISTRY_COMPARE_KEY)load();};load();window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);},[]);
 function toggle(slug?:string){let latest=selected;if(!sessionOnly.current)try{latest=normalizeRegistrySelection(JSON.parse(localStorage.getItem(REGISTRY_COMPARE_KEY)||"[]"));}catch{/* Keep session selection. */}if(slug&&!latest.includes(slug)&&latest.length>=3){setMessage("Compare up to three projects. Remove one first.");return;}const next=slug?normalizeRegistrySelection(latest.includes(slug)?latest.filter(s=>s!==slug):[...latest,slug]):[];setSelected(next);try{localStorage.setItem(REGISTRY_COMPARE_KEY,JSON.stringify(next));sessionOnly.current=false;setMessage("Selection saved on this device.");}catch{sessionOnly.current=true;setMessage("Comparison kept in this page only; device storage unavailable.");}}
 const compareHref="/real-estate/registry/compare?"+new URLSearchParams({projects:selected.join(",")});
 return <>{!rows.length&&<p className="mb-4 text-sm text-[var(--text-soft)]">No source-backed records match this search. Broaden the filters or check MahaRERA directly.</p>}<div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4" aria-label="Registry comparison selection"><p className="text-sm">{selected.length}/3 selected · selection carries across pages</p>{selected.length>=2&&<Link href={compareHref} className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm">Compare project records</Link>}{selected.length>0&&<button type="button" className="gth-btn min-h-11" onClick={()=>toggle()}>Clear comparison</button>}<Link href="/real-estate/saved#research-workspace" className="gth-btn inline-flex min-h-11 items-center">Private research workspace</Link>{message&&<p role="status" className="w-full text-xs">{message}</p>}</div><div role="region" aria-label="Registry project table" tabIndex={0} className="min-w-0 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
  <table className="w-full min-w-[690px] text-left text-xs sm:text-sm">
   <caption className="sr-only">{caption}</caption>
   <thead className="border-b border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)]">
    <tr><th scope="col" className="p-3 font-semibold">Project</th><th scope="col" className="p-3 font-semibold">MahaRERA reference</th><th scope="col" className="p-3 font-semibold">Developer / location</th><th scope="col" className="p-3 font-semibold">Recorded timeline</th><th scope="col" className="p-3 font-semibold">Official source</th></tr>
   </thead>
   <tbody className="divide-y divide-[var(--border)]">
    {rows.map(p=>{
     const source=officialMahaReraUrl(p.official_source_url);
     // Never infer on-time, delayed, completed or under-construction status from
     // an imported date. Only official source / project updates can confirm it.
     const timeline=typeof p.completion_date==="string"&&/^\d{4}-\d{2}-\d{2}/.test(p.completion_date)
       ?p.completion_date.slice(0,10):"Not recorded";
     return <tr key={p.slug} className="align-top hover:bg-[var(--bg-soft)]">
      <td className="p-3 font-medium"><Link href={"/real-estate/"+encodeURIComponent(p.slug)} className="underline-offset-2 hover:underline">{p.title}</Link><div className="mt-2 flex flex-wrap items-center gap-3"><SavePropertyButton slug={p.slug} className="gth-btn inline-flex min-h-11 items-center justify-center"/><label className="flex min-h-11 items-center gap-2 text-xs font-normal"><input type="checkbox" checked={selected.includes(p.slug)} disabled={!selected.includes(p.slug)&&selected.length>=3} onChange={()=>toggle(p.slug)}/>Compare<span className="sr-only"> {p.title}</span></label></div>{p.rera_id && /^P[0-9]{11}$/.test(p.rera_id) && <Link href={"/real-estate/claim-project?rera="+encodeURIComponent(p.rera_id)} className="mt-2 block text-[11px] font-normal underline underline-offset-2 text-[var(--text-soft)]">Builder or authorized agent? Request a project claim</Link>}</td>
      <td className="p-3 font-mono">{p.rera_id||"Not recorded"}</td>
      <td className="p-3">{known(p.developer)||known(p.builder_name)||"Developer not recorded"}<span className="mt-1 block text-[var(--text-soft)]">{[known(p.city),known(p.district)].filter(Boolean).join(" · ")||"Location not recorded"}</span></td>
      <td className="p-3"><span>{timeline}</span><span className="mt-1 block text-[11px] text-[var(--text-soft)]">Recorded date; no delay verdict</span></td>
      <td className="p-3">{source?<a href={source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">MahaRERA record</a>:<span className="text-[var(--text-soft)]">Not linked</span>}</td>
     </tr>
    })}
   </tbody>
  </table>
 </div></>;
}
