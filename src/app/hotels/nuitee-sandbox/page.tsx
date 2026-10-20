"use client";
import { useEffect, useState } from "react";
import NuiteeSandboxGallery from "@/components/hotels/NuiteeSandboxGallery";
type Hotel={supplierHotelId:string;name:string;city:string|null;address:string|null;images:string[];stars:number|null;facilities:unknown[]};
function SupplierCardPhoto({ hotel }: { hotel: Hotel }) {
 const [broken, setBroken] = useState(false);
 const url = hotel.images?.[0];
 useEffect(() => setBroken(false), [hotel.supplierHotelId, url]);
 if (!url || broken) return <div className="flex h-44 items-center justify-center bg-[var(--bg)] text-sm text-[var(--text-soft)]">{broken ? "Supplier image failed to load" : "No supplier photo provided"}</div>;
 return <img src={url} alt={"Nuitee supplier preview for "+hotel.name} onError={() => setBroken(true)} className="h-44 w-full object-cover" loading="lazy" referrerPolicy="no-referrer"/>;
}
export default function NuiteeSandboxPage(){
 const [token,setToken]=useState("");const [city,setCity]=useState("Mumbai");
 const [country,setCountry]=useState("IN");const [hotels,setHotels]=useState<Hotel[]>([]);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [detail,setDetail]=useState<Hotel|null>(null);
 async function run(){
  setBusy(true);setError("");setHotels([]);setDetail(null);
  try{
   const qs=new URLSearchParams({city:city.trim(),country:country.trim().toUpperCase(),limit:"12"});
   const r=await fetch("/api/hotels/nuitee/search?"+qs,{headers:{"x-gth-nuitee-test-token":token},cache:"no-store"});
   if(!r.ok)throw Error(r.status===404?"Preview test authorization failed or sandbox disabled":r.status===503?"Sandbox key missing":"Supplier search failed ("+r.status+")");
   const result:unknown=await r.json();if(!result||typeof result!=="object"||!Array.isArray((result as {data?:unknown}).data))throw Error("Unexpected supplier response");
   setHotels((result as {data:Hotel[]}).data);
  }catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false)}
 }
 async function inspect(id:string){
  setBusy(true);setError("");
  try{const r=await fetch("/api/hotels/nuitee/"+encodeURIComponent(id),{headers:{"x-gth-nuitee-test-token":token},cache:"no-store"});
   if(!r.ok)throw Error("Hotel detail unavailable ("+r.status+")");
   const result=await r.json() as {data:Hotel};setDetail(result.data);
  }catch(e){setError(e instanceof Error?e.message:"Request failed")}finally{setBusy(false)}
 }
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-10"><div className="mx-auto max-w-6xl space-y-6">
 <div className="gth-glass rounded-2xl border border-[var(--border)] p-6 space-y-3"><h1 className="text-2xl font-bold">Nuitee hotel sandbox verification</h1>
 <p className="text-sm text-[var(--text-soft)]">Preview testing only. Supplier results are not confirmed reservations. Test token stays in this page memory; do not use your Nuitee API key here.</p>
 <form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();void run()}}>
 <label className="flex flex-col gap-1 text-sm">City<input aria-label="City" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" value={city} onChange={e=>setCity(e.target.value)} required/></label>
 <label className="flex flex-col gap-1 text-sm">Country code<input aria-label="Country code" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" value={country} onChange={e=>setCountry(e.target.value)} maxLength={2} required/></label>
 <label className="flex min-w-64 grow flex-col gap-1 text-sm">Internal preview test token<input aria-label="Internal preview test token" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} required/></label>
 <button className="gth-btn-gold rounded-lg px-5 py-3 self-end" disabled={busy}>{busy?"Checking…":"Search supplier hotels"}</button></form></div>
 {error&&<p role="alert" className="rounded-lg border border-[var(--border)] p-4">{error}</p>}
 {!busy&&!error&&hotels.length===0&&<p className="text-sm text-[var(--text-soft)]">Enter the separate preview test token and search. No catalog is preloaded.</p>}
 <p aria-live="polite" className="text-sm">{hotels.length?hotels.length+" sandbox supplier hotel records returned":""}</p>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{hotels.map(h=><article key={h.supplierHotelId} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
 <SupplierCardPhoto hotel={h}/>
 <div className="space-y-2 p-4"><h2 className="font-semibold">{h.name}</h2><p className="text-sm text-[var(--text-soft)]">{h.address||h.city||"Address unavailable"}</p><p className="text-xs text-[var(--text-soft)]">Supplier ID: {h.supplierHotelId}</p><button className="gth-btn-gold rounded-lg px-4 py-2 text-sm" disabled={busy} onClick={()=>void inspect(h.supplierHotelId)}>View supplier details</button></div></article>)}</div>
 {detail&&<section className="gth-glass space-y-3 rounded-xl p-5" aria-label="Hotel details"><h2 className="text-xl font-semibold">{detail.name}</h2><p>{detail.address||"Address unavailable"}</p><p className="text-sm">{detail.facilities?.length||0} supplier facility records</p><NuiteeSandboxGallery hotelId={detail.supplierHotelId} hotelName={detail.name} urls={detail.images||[]}/></section>}
 </div></main>
}
