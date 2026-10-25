"use client";
import Link from "next/link";
import {Bookmark,BriefcaseBusiness,Building2,Calculator,CarFront,Compass,FileCheck2,Globe2,Heart,Hotel,Plane,Route,ShieldCheck,Smartphone} from "lucide-react";
import {Star} from "lucide-react";
import {appServices} from "@/lib/mobile/app-dashboard";
const icons={plane:Plane,hotel:Hotel,building:Building2,briefcase:BriefcaseBusiness,transfer:Route,car:CarFront,compass:Compass,shield:ShieldCheck,globe:Globe2,sim:Smartphone,heart:Heart,calculator:Calculator,bookmark:Bookmark,file:FileCheck2};
export default function AppServiceGrid({services,favourites,editing,onToggle,onSelect}:{services:readonly (typeof appServices[number])[];favourites:string[];editing:boolean;onToggle:(id:string)=>void;onSelect:(id:string)=>void}){
 return <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6">{services.map(service=>{const Icon=icons[service.icon],pinned=favourites.includes(service.id);return <div key={service.id} className="min-w-0">
 <Link href={service.href} onClick={()=>onSelect(service.id)} aria-label={`${service.label}${pinned?', favourite':''}`} className="group flex min-h-24 min-w-0 flex-col items-center gap-2 rounded-2xl py-2 text-center focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
 <span className="gth-glass relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-transform duration-200 group-active:scale-95 motion-reduce:transform-none"><Icon size={30} strokeWidth={1.7} className="text-[var(--gold)]" aria-hidden="true"/>{pinned&&<Star size={12} className="absolute right-0 top-0 fill-current text-[var(--gold)]" aria-hidden="true"/>}</span>
 <span className="max-w-full text-[11px] font-semibold leading-4">{service.label}</span></Link>
 {editing&&<button type="button" aria-label={`${pinned?'Unpin':'Pin'} ${service.label}`} aria-pressed={pinned} disabled={!pinned&&favourites.length>=8} onClick={()=>onToggle(service.id)} className="min-h-11 w-full rounded-xl border border-[var(--border)] text-xs disabled:opacity-40">{pinned?'Unpin':'Pin'}</button>}
 </div>;})}</div>;
}
export function AppRecentServices({recent,onSelect,onClear}:{recent:string[];onSelect:(id:string)=>void;onClear:()=>void}){
 const services=recent.flatMap(id=>{const service=appServices.find(item=>item.id===id);return service?[service]:[];});
 if(!services.length)return null;
 return <section aria-label="Recently used" className="px-4 pt-3 sm:px-6"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recently used</h2><button type="button" onClick={onClear} className="min-h-11 text-xs text-[var(--gold)]">Clear recent</button></div><div className="flex gap-2 overflow-x-auto pb-2">{services.map(service=><Link key={service.id} href={service.href} onClick={()=>onSelect(service.id)} className="flex min-h-11 shrink-0 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs">{service.label}</Link>)}</div></section>;
}
