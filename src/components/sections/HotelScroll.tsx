"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,Hotel} from "lucide-react";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";

type DirectoryStay={id:string|number;name:string;city:string;image:string;source?:string};
function validStay(value:unknown):value is DirectoryStay{
 if(!value||typeof value!=="object")return false;
 const row=value as Partial<DirectoryStay>;
 return (typeof row.id==="string"||typeof row.id==="number")&&
  String(row.id).length<=120&&typeof row.name==="string"&&row.name.length>=2&&
  typeof row.city==="string"&&typeof row.image==="string";
}
/** Legacy UI surface: only source records. Never invent hotel photos, rates,
 * five-star ratings, real-time room stock or an unauthorized affiliate marker.
 * Directory research and Nuitee booking are independent.
 */
export default function HotelScroll({city="Goa"}:{city?:string}){
 const [stays,setStays]=useState<DirectoryStay[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const place=city.trim().slice(0,80);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError(false);setStays([]);
  const params=new URLSearchParams({city:place||"Goa",page:"1"});
  void fetch("/api/hotels?"+params,{signal:controller.signal,cache:"no-store"}).then(async response=>{
   if(!response.ok)throw new Error("Directory unavailable");
   const result:unknown=await response.json();
   if(!Array.isArray(result))throw new Error("Invalid directory response");
   if(!controller.signal.aborted)setStays(result.filter(validStay).slice(0,16));
  }).catch(()=>{
   if(!controller.signal.aborted)setError(true);
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[place]);
 return <section aria-label="Source-backed hotel directory preview" className="mx-auto max-w-7xl px-4 py-10 text-[var(--text)]">
  <div className="flex flex-wrap items-end justify-between gap-4">
   <div><h2 className="text-2xl font-bold">Hotels in {place||"your destination"}</h2>
    <p className="mt-2 text-sm text-[var(--text-soft)]">Public directory records only. Prices, stars and rooms are not verified live stock.</p></div>
   <Link href={"/hotels?"+new URLSearchParams({view:"booking",city:place||"Goa"})}
    className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Book a stay with Nuitee <ArrowRight size={16}/></Link>
  </div>
  {loading&&<p role="status" className="mt-6 text-sm text-[var(--text-soft)]">Loading recorded hotel descriptions…</p>}
  {error&&<p role="alert" className="mt-6 text-sm text-[var(--text-soft)]">Directory records are unavailable. Use the booking search to check real supplier rooms.</p>}
  {!loading&&!error&&stays.length===0&&<p role="status" className="mt-6 text-sm text-[var(--text-soft)]">No source-backed directory entries for this city yet. This does not mean the supplier has no hotels.</p>}
  {stays.length>0&&<div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
   {stays.map(stay=><article key={String(stay.id)} className="flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
    <div className="h-36 bg-[var(--bg-soft)]"><HotelPropertyImage src={stay.image} name={stay.name}
     className="h-full w-full object-cover" placeholderClassName="flex h-full items-center justify-center text-[var(--text-soft)]"/></div>
    <div className="flex flex-1 flex-col p-4"><p className="text-xs text-[var(--text-soft)]"><Hotel size={13} className="inline"/> {stay.city}</p>
     <h3 className="mt-2 line-clamp-2 text-base font-bold">{stay.name}</h3>
     <Link href={"/hotels/stay/"+encodeURIComponent(String(stay.id))} className="gth-btn mt-auto inline-flex min-h-11 items-center justify-center rounded-xl px-3 pt-4 text-sm font-semibold">View source details</Link>
    </div>
   </article>)}
  </div>}
 </section>;
}
