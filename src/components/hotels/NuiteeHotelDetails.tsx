"use client";
import {useState} from "react";
import NuiteeSandboxGallery from "@/components/hotels/NuiteeSandboxGallery";
type H={supplierHotelId:string;name:string;address:string|null;city:string|null;stars:number|null;description:string|null;images:string[];facilities:unknown[];rooms:unknown[]};
const asObject=(v:unknown):Record<string,unknown>|null=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
function readable(v:unknown):string {
 if(typeof v==="string")return v.replace(/<br\s*\/?\s*>/gi,". ").replace(/<\/?(?:p|div|li|ul|ol|strong|b|em|span)[^>]*>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g," ").trim();
 if(typeof v==="number")return String(v);
 return "";
}
function recordName(v:unknown,keys:string[]):string{
 if(typeof v==="string")return readable(v);
 const o=asObject(v);if(!o)return "";
 for(const k of keys){const text=readable(o[k]);if(text)return text;}
 return "";
}
function listNames(records:unknown[],keys:string[]):string[]{
 return [...new Set((records||[]).map(x=>recordName(x,keys)).filter(Boolean))].slice(0,100);
}
export default function NuiteeHotelDetails({hotel}:{hotel:H}){
 const [tab,setTab]=useState<"overview"|"amenities"|"rooms"|"photos">("overview");
 const amenities=listNames(hotel.facilities,["name","facilityName","description","label","title"]);
 const rooms=listNames(hotel.rooms,["name","roomName","roomTypeName","description","title"]);
 const description=readable(hotel.description);
 const tabs=[["overview","Overview"],["amenities","Amenities"],["rooms","Rooms"],["photos","Photos"]] as const;
 return <main className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] md:p-10"><div className="mx-auto max-w-6xl space-y-5">
 <a className="inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm" href="/hotels/nuitee-sandbox">← Back to hotel catalog</a>
 <header className="gth-glass space-y-3 rounded-2xl border border-[var(--border)] p-6">
 <p className="text-xs font-semibold text-[var(--text-soft)]">NUITEE SUPPLIER · SANDBOX PREVIEW</p><h1 className="text-2xl font-bold md:text-3xl">{hotel.name}</h1>
 <p className="text-sm text-[var(--text-soft)]">{hotel.address||hotel.city||"Address not provided by supplier"}</p>
 <p className="text-sm">{hotel.stars===null?"Official star classification not supplied":hotel.stars+" star hotel"} · {hotel.images?.length||0} photos</p>
 </header>
 <nav aria-label="Hotel detail categories" className="flex snap-x gap-2 overflow-x-auto pb-2">{tabs.map(([id,label])=><button key={id} type="button" aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)} className={"shrink-0 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold "+(tab===id?"gth-btn-gold":"bg-[var(--card)]")}>{label}</button>)}</nav>
 {tab==="overview"&&<section className="gth-glass space-y-3 rounded-2xl p-6"><h2 className="text-xl font-semibold">About this property</h2><p className="text-sm leading-7 text-[var(--text-soft)]">{description||"Supplier has not provided a hotel description."}</p><div className="grid gap-3 sm:grid-cols-3">{[["Facilities",amenities.length],["Room types",rooms.length],["Photo URLs",hotel.images?.length||0]].map(([label,count])=><div key={label} className="rounded-xl border border-[var(--border)] p-4"><p className="text-sm text-[var(--text-soft)]">{label}</p><p className="text-xl font-semibold">{count}</p></div>)}</div></section>}
 {tab==="amenities"&&<section className="gth-glass rounded-2xl p-6"><h2 className="mb-4 text-xl font-semibold">Hotel facilities and amenities</h2>{amenities.length?<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{amenities.map(s=><li className="rounded-lg border border-[var(--border)] p-3 text-sm" key={s}>{s}</li>)}</ul>:<p className="text-sm text-[var(--text-soft)]">No readable facility names were supplied for this hotel.</p>}</section>}
 {tab==="rooms"&&<section className="gth-glass rounded-2xl p-6"><h2 className="mb-4 text-xl font-semibold">Supplier room types</h2>{rooms.length?<ul className="grid gap-3 sm:grid-cols-2">{rooms.map((s,i)=><li className="rounded-xl border border-[var(--border)] p-4" key={s+i}><p className="font-semibold">{s}</p><p className="mt-2 text-xs text-[var(--text-soft)]">Room type information only · No live price or availability confirmed</p></li>)}</ul>:<p className="text-sm text-[var(--text-soft)]">No readable room type names were supplied.</p>}</section>}
 {tab==="photos"&&<section className="gth-glass rounded-2xl p-5"><h2 className="mb-3 text-xl font-semibold">Hotel photographs</h2><NuiteeSandboxGallery hotelId={hotel.supplierHotelId} hotelName={hotel.name} urls={hotel.images||[]}/></section>}
 <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"><h2 className="font-semibold">Booking information</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Sandbox verification only. Pricing, tax, availability and cancellation terms require a date-specific rate search. No confirmed reservation or live checkout is offered on this preview.</p></aside>
 </div></main>;
}
