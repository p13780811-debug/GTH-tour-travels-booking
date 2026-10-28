"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {RECENT_KEY,normalizeRecent,rememberProperty,type RecentProperty} from "@/lib/real-estate/recently-viewed";

export function RecordPropertyView({slug,title,city}:{slug:string;title:string;city:string}){
 useEffect(()=>{try{const previous=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');localStorage.setItem(RECENT_KEY,JSON.stringify(rememberProperty(previous,{slug,title,city})));window.dispatchEvent(new Event('gth-property-viewed'));}catch{/* Optional history must never prevent opening a property. */}},[slug,title,city]);
 return null;
}
export default function RecentlyViewed(){
 const [items,setItems]=useState<RecentProperty[]>([]),[message,setMessage]=useState('');
 useEffect(()=>{const load=()=>{try{setItems(normalizeRecent(JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')));}catch{setItems([]);}};const sync=(event:StorageEvent)=>{if(!event.key||event.key===RECENT_KEY)load();};load();window.addEventListener('storage',sync);window.addEventListener('gth-property-viewed',load);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('gth-property-viewed',load);};},[]);
 return <section aria-labelledby="recent-properties-title" className="gth-glass mt-8 rounded-3xl p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="recent-properties-title" className="text-xl font-bold">Recently viewed properties</h2>{items.length>0&&<button type="button" className="gth-btn min-h-11" onClick={()=>{try{localStorage.removeItem(RECENT_KEY);setItems([]);setMessage('Browsing history cleared on this device.');window.dispatchEvent(new Event('gth-property-viewed'));}catch{setMessage('Device storage could not be cleared.');}}}>Clear viewing history</button>}</div><p className="mt-3 text-sm leading-6 opacity-70">Up to 12 records from the last 30 days, stored only in this browser. Reopen a record for its current details; this history does not confirm sale availability.</p>{items.length?<ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><li key={item.slug} className="rounded-xl border p-4"><Link className="inline-flex min-h-11 items-center font-semibold underline" href={`/real-estate/${encodeURIComponent(item.slug)}`}>{item.title}</Link>{item.city&&<p className="mt-1 text-sm">{item.city}</p>}</li>)}</ul>:<p className="mt-4 text-sm">Properties you open will appear here. <Link className="underline" href="/real-estate">Explore properties</Link>.</p>}{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</section>;
}
