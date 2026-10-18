"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

// The supplied Impact.com publisher STAT tag, loaded only after explicit consent.
export const IMPACT_STAT_SCRIPT="https://utt.impactcdn.com/P-A7994211-fddb-452e-b462-635aeb20c5681.js";
const KEY="gth-impact-publisher-consent-v1";
const EVENT="gth-impact-consent-change";
const PATHS=["/travel","/tours","/activities","/guides","/blog","/destinations","/attractions"];
type Consent="allow"|"deny"|null;
type Command="transformLinks"|"trackImpression";
type ImpactFn=((command:Command)=>void)&{a?:Command[][]};
declare global {interface Window {impactStat?:ImpactFn;ire_o?:string}}
const eligible=(p:string)=>PATHS.some(x=>p===x||p.startsWith(x+"/"));
function read():Consent {
 try{const v=localStorage.getItem(KEY);return v==="allow"||v==="deny"?v:null;}catch{return null;}
}
function save(c:"allow"|"deny"):boolean{
 try{localStorage.setItem(KEY,c);}catch{return false;}
 window.dispatchEvent(new Event(EVENT));return true;
}
export function ImpactPublisherConsent(){
 const pathname=usePathname()||"";
 const [choice,setChoice]=useState<Consent>(null);
 const [ready,setReady]=useState(false);
 const active=eligible(pathname);
 useEffect(()=>{
  const sync=()=>{
   const c=read();setChoice(c);setReady(true);
   // Loaded third-party code cannot be fully unloaded: reload on withdrawal.
   if(c==="deny"&&document.querySelector('script[data-gth-impact="publisher"]'))location.reload();
  };
  sync();
  window.addEventListener(EVENT,sync);window.addEventListener("storage",sync);
  return()=>{window.removeEventListener(EVENT,sync);window.removeEventListener("storage",sync);};
 },[]);
 useEffect(()=>{
  // Client navigation retains third-party scripts; unload when leaving Travel.
  if(!active&&document.querySelector('script[data-gth-impact="publisher"]')){
   location.reload();return;
  }
  if(!active||choice!=="allow")return;
  const u=new URL(IMPACT_STAT_SCRIPT);
  if(u.protocol!=="https:"||u.hostname!=="utt.impactcdn.com")return;
  if(!window.impactStat){
   const q=((cmd:Command)=>{(q.a??=[]).push([cmd]);}) as ImpactFn;
   q.a=[];window.ire_o="impactStat";window.impactStat=q;
  }
  if(!document.querySelector('script[data-gth-impact="publisher"]')){
   const s=document.createElement("script");s.src=IMPACT_STAT_SCRIPT;s.async=true;
   s.dataset.gthImpact="publisher";s.onerror=()=>s.remove();document.head.appendChild(s);
  }
  window.impactStat?.("transformLinks");
  window.impactStat?.("trackImpression");
 },[choice,active,pathname]);
 const set=(c:"allow"|"deny")=>{if(save(c))setChoice(c);};
 if(!ready||!active||choice!==null)return null;
 return <aside role="dialog" aria-label="Optional affiliate analytics" aria-modal="false"
  className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-3 right-3 z-[60] mx-auto max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--text)] shadow-2xl md:bottom-6">
  <p className="text-sm font-bold">Optional affiliate tracking</p>
  <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Allow Impact.com to convert eligible partner links and measure impressions on Travel discovery pages? It may use cookies and page/link data. You can decline and continue browsing. <Link href="/privacy-policy#cookies" className="underline">Privacy details</Link>.</p>
  <div className="mt-3 flex justify-end gap-2 text-xs">
   <button type="button" onClick={()=>set("deny")} className="min-h-10 rounded-lg border border-[var(--border)] px-4">Decline</button>
   <button type="button" onClick={()=>set("allow")} className="gth-btn-gold min-h-10 rounded-lg px-4">Allow Impact</button>
  </div>
 </aside>;
}
export function ImpactConsentSettings(){
 const [choice,setChoice]=useState<Consent>(null);
 useEffect(()=>{
  const sync=()=>setChoice(read());sync();window.addEventListener(EVENT,sync);window.addEventListener("storage",sync);
  return()=>{window.removeEventListener(EVENT,sync);window.removeEventListener("storage",sync);};
 },[]);
 const set=(c:"allow"|"deny")=>{if(save(c))setChoice(c);};
 return <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
  <p className="text-sm font-semibold">Impact.com affiliate tracking preferences</p>
  <p className="mt-2 text-sm">Current setting: {choice==="allow"?"Allowed":choice==="deny"?"Declined":"Not chosen"}. Other site analytics are separate.</p>
  <div className="mt-3 flex flex-wrap gap-2 text-sm">
   <button type="button" onClick={()=>set("allow")} aria-pressed={choice==="allow"} className="min-h-10 rounded-lg border border-[var(--border)] px-4">Allow</button>
   <button type="button" onClick={()=>set("deny")} aria-pressed={choice==="deny"} className="min-h-10 rounded-lg border border-[var(--border)] px-4">Decline / withdraw</button>
  </div>
 </div>;
}
