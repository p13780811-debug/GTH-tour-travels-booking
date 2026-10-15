"use client";
import {useEffect,useState} from "react";
import {Globe2,ShieldCheck,Clock3,Layers3} from "lucide-react";
import {hotelSearchParams} from "@/lib/travel/hotel-search-params";
export const HOTEL_TYPES=[
  {id:"",name:"All stays"},
  {id:"hotel",name:"Hotels"},
  {id:"resort",name:"Resorts"},
  {id:"hostel",name:"Hostels"},
  {id:"guest_house",name:"Guest houses"},
  {id:"motel",name:"Motels"},
  {id:"apartment",name:"Apartments"}
] as const;
type Stats={country:string|null;total:number;categories:Record<string,number>;latest_imported_at:string|null;source_license:string;availability_verified:boolean};
export default function HotelCatalogPulse({country,category,city,destination,name,onCategory}:{
 country:string;category:string;city:string;destination:string;name:string;onCategory:(type:string)=>void;
}){
 const [stats,setStats]=useState<Stats|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const params=hotelSearchParams({destination,city,name,country,category:""},1);
  params.delete("page");
  setStats(null);setError(false);
  fetch("/api/hotels/stats?"+params,{cache:"no-store",signal:controller.signal})
   .then(r=>{if(!r.ok)throw Error("Stats unavailable");return r.json();})
   .then(v=>{if(!controller.signal.aborted)setStats(v as Stats);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return ()=>controller.abort();
 },[country,city,destination,name]);
 return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Live accommodation catalog facts">
  <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:grid-cols-3">
   <div><p className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]"><Layers3 size={15}/> Source catalog matching your search</p>
    <p className="mt-3 text-3xl font-bold tabular-nums">{stats?stats.total.toLocaleString():error?"Unavailable":"—"}</p></div>
   <div><p className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]"><Globe2 size={15}/> Country filter</p>
    <p className="mt-3 text-lg font-semibold">{stats?.country||country||"Worldwide"}</p></div>
   <div><p className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]"><Clock3 size={15}/> Latest catalog addition</p>
    <p className="mt-3 text-sm font-semibold">{stats?.latest_imported_at?
      new Date(stats.latest_imported_at).toLocaleString():"No import recorded for this area"}</p></div>
  </div>
  <p className="mt-3 inline-flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
   <ShieldCheck size={16} className="mt-1 shrink-0"/>
   © OpenStreetMap contributors (ODbL 1.0). Hotel directory data is not room availability,
   verified hotel star rating, live price, guest review or confirmed booking.
  </p>
  <h2 className="mt-8 text-xl font-semibold">Explore by property type</h2>
  <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Accommodation category filter">
   {HOTEL_TYPES.map(t=><button key={t.id} type="button" onClick={()=>onCategory(t.id)}
     aria-pressed={category===t.id}
     className={"shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold "+(category===t.id?
       "border-[var(--gold)] bg-[var(--card)]":"border-[var(--border)] bg-[var(--bg)] hover:border-[var(--gold)]")}>
      {t.name}{stats&&t.id?" · "+(stats.categories[t.id]??0):""}
   </button>)}
  </div>
 </section>;
}
