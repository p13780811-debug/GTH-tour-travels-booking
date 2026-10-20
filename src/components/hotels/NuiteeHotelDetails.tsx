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
 const [cover,setCover]=useState(0);
 const [broken,setBroken]=useState<number[]>([]);
 const heroImages=(hotel.images||[]).slice(0,5);
 const amenities=listNames(hotel.facilities,["name","facilityName","description","label","title"]);
 const rooms=listNames(hotel.rooms,["name","roomName","roomTypeName","description","title"]);
 const description=readable(hotel.description);
 const tabs=[["overview","Overview"],["rooms","Rooms & Suites"],["amenities","Amenities"],["photos","Gallery"]] as const;
 const [checkin,setCheckin]=useState(""); const [checkout,setCheckout]=useState(""); const [guests,setGuests]=useState(2);
 const validStay=Boolean(checkin&&checkout&&checkout>checkin&&checkin>=new Date().toISOString().slice(0,10));
 return <main className="min-h-screen bg-[var(--bg)] p-4 text-[var(--text)] md:p-10"><div className="mx-auto max-w-6xl space-y-5">
 <a className="inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm" href="/hotels/nuitee-sandbox">← Back to hotel catalog</a>
 <header className="gth-glass overflow-hidden rounded-2xl border border-[var(--border)]"><div className="relative min-h-[430px] overflow-hidden bg-[var(--card)] md:min-h-[560px]">\n {heroImages[cover]&&!broken.includes(cover)&&<img src={heroImages[cover]} alt={hotel.name+" exterior or property image"} className="absolute inset-0 h-full w-full object-cover" onError={()=>setBroken(s=>[...s,cover])}/>}\n <div className="absolute inset-0 bg-gradient-to-r from-[rgba(4,13,29,0.94)] via-[rgba(4,13,29,0.68)] to-[rgba(4,13,29,0.3)]" aria-hidden="true"/>\n <div className="relative z-10 grid min-h-[430px] gap-6 p-5 text-white md:min-h-[560px] md:grid-cols-[minmax(0,1fr)_320px] md:items-center md:p-9"><div className="max-w-2xl space-y-5">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">GTH PRO · Signature Stays · Sandbox</p><h1 className="text-3xl font-bold leading-tight md:text-5xl">{hotel.name}</h1>
 <p className="text-sm text-slate-200">{hotel.address||hotel.city||"Address not provided by supplier"}</p>
 <p className="text-sm">{hotel.stars===null?"Official star classification not supplied":hotel.stars+" star hotel"} · {hotel.images?.length||0} supplier photographs</p>\n <p className="max-w-xl text-sm leading-7 text-slate-200">{description.slice(0,240)||"Explore real supplier hotel information and discover the property."}</p>\n <div className="flex flex-wrap gap-3 text-xs text-amber-100"><span>✦ GTH PRO discovery</span><span>✦ Supplier hotel details</span><span>✦ Secure booking partner</span></div></div>\n <form className="gth-glass space-y-3 rounded-xl border border-[var(--border)] p-5 text-[var(--text)]" onSubmit={e=>{e.preventDefault();if(validStay)setTab("rooms")}}><h2 className="text-xl font-semibold">Check availability</h2><p className="text-xs text-[var(--text-soft)]">Select dates to explore room types. Preview rates are not live.</p><label className="block text-xs">Check-in<input aria-label="Check-in date" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--text)]" type="date" value={checkin} min={new Date().toISOString().slice(0,10)} onChange={e=>setCheckin(e.target.value)}/></label><label className="block text-xs">Check-out<input aria-label="Check-out date" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--text)]" type="date" value={checkout} min={checkin||new Date().toISOString().slice(0,10)} onChange={e=>setCheckout(e.target.value)}/></label><label className="block text-xs">Adults<input aria-label="Adult guests" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--text)]" type="number" min={1} max={8} value={guests} onChange={e=>setGuests(Math.min(8,Math.max(1,Number(e.target.value)||1)))}/></label><button type="submit" disabled={!validStay} className="gth-btn-gold w-full rounded-lg p-3 font-semibold disabled:opacity-50">Explore rooms →</button></form></div></div>
 <div className="grid grid-cols-4 gap-2 p-3 md:grid-cols-5">{heroImages.map((url,i)=><button key={url} className="h-20 overflow-hidden rounded-lg border border-[var(--border)] md:h-28" type="button" onClick={()=>setCover(i)} aria-label={"Show property photograph "+(i+1)}><img src={url} alt="" loading="lazy" className="h-full w-full object-cover"/></button>)}</div></header>
  <nav aria-label="Hotel detail categories" className="flex snap-x gap-2 overflow-x-auto pb-2">{tabs.map(([id,label])=><button key={id} type="button" aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)} className={"shrink-0 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold "+(tab===id?"gth-btn-gold":"bg-[var(--card)]")}>{label}</button>)}</nav>
 {tab==="overview"&&<section className="gth-glass space-y-3 rounded-2xl p-6"><h2 className="text-xl font-semibold">About this property</h2><p className="text-sm leading-7 text-[var(--text-soft)]">{description||"Supplier has not provided a hotel description."}</p><div className="grid gap-3 sm:grid-cols-3">{[["Facilities",amenities.length],["Room types",rooms.length],["Photo URLs",hotel.images?.length||0]].map(([label,count])=><div key={label} className="rounded-xl border border-[var(--border)] p-4"><p className="text-sm text-[var(--text-soft)]">{label}</p><p className="text-xl font-semibold">{count}</p></div>)}</div></section>}
 {tab==="amenities"&&<section className="gth-glass rounded-2xl p-6"><h2 className="mb-4 text-xl font-semibold">Hotel facilities and amenities</h2>{amenities.length?<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{amenities.map(s=><li className="rounded-lg border border-[var(--border)] p-3 text-sm" key={s}>{s}</li>)}</ul>:<p className="text-sm text-[var(--text-soft)]">No readable facility names were supplied for this hotel.</p>}</section>}
 {tab==="rooms"&&<section className="gth-glass rounded-2xl p-6"><h2 className="mb-4 text-2xl font-semibold">Rooms & Suites</h2>{rooms.length?<ul className="grid gap-3 sm:grid-cols-2">{rooms.map((s,i)=><li className="rounded-xl border border-[var(--border)] p-4" key={s+i}><p className="text-lg font-semibold">{s}</p><p className="mt-2 text-xs text-[var(--text-soft)]">Supplier room type · Rate, meal plan and cancellation depend on travel dates</p><a className="mt-4 inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm" href={"/hotels/nuitee-sandbox/"+encodeURIComponent(hotel.supplierHotelId)+"/checkout"}>Review stay selection →</a></li>)}</ul>:<p className="text-sm text-[var(--text-soft)]">No readable room type names were supplied.</p>}</section>}
 {tab==="photos"&&<section className="gth-glass rounded-2xl p-5"><h2 className="mb-3 text-xl font-semibold">Hotel photographs</h2><NuiteeSandboxGallery hotelId={hotel.supplierHotelId} hotelName={hotel.name} urls={hotel.images||[]}/></section>}
 <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"><h2 className="font-semibold">Booking information</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Sandbox verification only. Pricing, tax, availability and cancellation terms require a date-specific rate search. No confirmed reservation or live checkout is offered on this preview.</p></aside>
 </div></main>;
}
