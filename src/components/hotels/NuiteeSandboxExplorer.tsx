"use client";
import { useMemo,useState } from "react";
import Link from "next/link";
type Hotel={supplierHotelId:string;name:string;city:string|null;address:string|null;images:string[];stars:number|null;facilities:unknown[];description?:string|null;countryCode?:string|null;rooms?:unknown[]};
function Photo({hotel}:{hotel:Hotel}){
 const [failed,setFailed]=useState(false);
 const src=hotel.images?.[0];
 return src&&!failed?<img src={src} onError={()=>setFailed(true)} loading="lazy" alt={hotel.name+" genuine supplier photograph"} referrerPolicy="no-referrer" className="h-48 w-full object-cover"/>:<div className="flex h-48 items-center justify-center bg-[var(--bg)] text-sm text-[var(--text-soft)]">Supplier photo unavailable</div>;
}
export default function NuiteeSandboxExplorer({initialHotels,checkedAt}:{initialHotels:Hotel[];checkedAt:string|null}){
 const [name,setName]=useState("");const [stars,setStars]=useState("all");const [sort,setSort]=useState("name");

 const filtered=useMemo(()=>initialHotels.filter(h=>h.name.toLowerCase().includes(name.toLowerCase().trim())&&(stars==="all"||(h.stars??0)>=Number(stars))).sort((a,b)=>sort==="stars"?(b.stars??0)-(a.stars??0):a.name.localeCompare(b.name)),[initialHotels,name,stars,sort]);
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-10"><div className="mx-auto max-w-6xl space-y-6">
 <header className="gth-glass rounded-2xl border border-[var(--border)] p-6 space-y-3">
 <h1 className="text-2xl font-bold">GTH PRO Signature Stays — Mumbai</h1>
 <p className="text-sm text-[var(--text-soft)]">Actual Nuitee supplier hotel metadata loaded server-side; this is a non-bookable Preview catalog. Rates and reservations are not live.</p>
 <p className="text-sm" role="status">{initialHotels.length} supplier hotels loaded {checkedAt?"· Data retrieved "+new Date(checkedAt).toLocaleString():"· Supplier is temporarily unavailable"}</p>
 <div className="flex flex-wrap gap-3">
 <label className="flex grow flex-col gap-1 text-sm">Hotel name<input aria-label="Filter hotel names" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" placeholder="Search hotels" value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className="flex flex-col gap-1 text-sm">Minimum stars<select aria-label="Minimum hotel stars" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" value={stars} onChange={e=>setStars(e.target.value)}><option value="all">Any rating</option><option value="3">3 stars+</option><option value="4">4 stars+</option><option value="5">5 stars</option></select></label>
 <label className="flex flex-col gap-1 text-sm">Sort<select aria-label="Hotel sorting" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Name A–Z</option><option value="stars">Star rating</option></select></label></div></header>
 <p aria-live="polite" className="text-sm text-[var(--text-soft)]">Showing {filtered.length} of {initialHotels.length} hotels</p>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(h=><article key={h.supplierHotelId} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"><Photo hotel={h}/><div className="space-y-2 p-4"><h2 className="font-semibold">{h.name}</h2><p className="text-sm text-[var(--text-soft)]">{h.address||h.city||"Address unavailable"}</p><p className="text-xs text-[var(--text-soft)]">{h.stars===null?"Star rating unavailable":h.stars+" stars"} · {h.images?.length||0} images · Sandbox preview</p>
 <Link className="gth-btn-gold inline-block rounded-lg px-4 py-2 text-sm" href={"/hotels/signature/"+h.name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,96)+"--"+encodeURIComponent(h.supplierHotelId)}>View hotel details</Link></div></article>)}</div>
 {!filtered.length&&<p role="status" className="rounded-xl border border-[var(--border)] p-6">No matching supplier hotels. Clear filters or check supplier availability.</p>}

 </div></main>;
}
