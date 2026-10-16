"use client";

import {useState} from "react";
import {ArrowUpRight,PlaneTakeoff,CalendarDays,Search,ShieldCheck} from "lucide-react";
import type {FareOption} from "@/lib/flights/fare-search";

type Observations={dataType:"cached_observations";currency:"INR";results:FareOption[];notice:string};
const dateToday=()=>{const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);};
export default function MobileFlightSearch(){
 const [origin,setOrigin]=useState("CCU");
 const [destination,setDestination]=useState("");
 const [depart,setDepart]=useState("");
 const [returnDate,setReturnDate]=useState("");
 const [results,setResults]=useState<FareOption[]>([]);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 async function search(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading)return;
  setError("");setNotice("");setResults([]);
  const from=origin.trim().toUpperCase(),to=destination.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(from)||!/^[A-Z]{3}$/.test(to)||from===to||!depart||depart<dateToday()||(returnDate&&returnDate<depart)){
    setError("Choose different 3-letter airport codes and valid future travel dates.");return;
  }
  const params=new URLSearchParams({origin:from,destination:to,depart_date:depart});
  if(returnDate)params.set("return_date",returnDate);
  const controller=new AbortController();
  setLoading(true);
  try{
   const response=await fetch("/api/flights/search?"+params,{cache:"no-store",signal:controller.signal});
   if(!response.ok)throw Error("Unavailable");
   const data:Observations=await response.json();
   if(data.dataType!=="cached_observations"||data.currency!=="INR"||!Array.isArray(data.results))throw Error("Invalid data");
   setResults(data.results.slice(0,40));setNotice(data.notice);
  }catch{setError("Flight observations are currently unavailable. Please try again.");}
  finally{setLoading(false);}
 }
 return <section aria-labelledby="app-flight-search" className="mx-4 mt-3 space-y-4 sm:mx-6">
  <form onSubmit={event=>void search(event)} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
   <h2 id="app-flight-search" className="inline-flex items-center gap-2 text-base font-semibold"><PlaneTakeoff size={18} className="text-[var(--gold)]"/> Flight search</h2>
   <div className="mt-4 grid grid-cols-2 gap-3">
    <label className="text-xs font-semibold text-[var(--text-soft)]">From (IATA)
     <input value={origin} maxLength={3} onChange={e=>setOrigin(e.target.value.toUpperCase())}
      autoComplete="off" placeholder="CCU" required pattern="[A-Z]{3}"
      className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
    </label>
    <label className="text-xs font-semibold text-[var(--text-soft)]">To (IATA)
     <input value={destination} maxLength={3} onChange={e=>setDestination(e.target.value.toUpperCase())}
      autoComplete="off" placeholder="BOM" required pattern="[A-Z]{3}"
      className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
    </label>
    <label className="text-xs font-semibold text-[var(--text-soft)]">Departure
     <input type="date" min={dateToday()} required value={depart} onChange={e=>setDepart(e.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--text)]"/>
    </label>
    <label className="text-xs font-semibold text-[var(--text-soft)]">Return (optional)
     <input type="date" min={depart||dateToday()} value={returnDate} onChange={e=>setReturnDate(e.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--text)]"/>
    </label>
   </div>
   <button type="submit" disabled={loading} className="gth-btn-gold mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">
    <Search size={16}/>{loading?"Searching…":"Find flight observations"}
   </button>
   <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Fares are cached supplier observations, not real-time availability.</p>
  </form>
  {error?<p role="alert" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">{error}</p>:null}
  {notice?<p role="status" className="flex gap-2 text-xs leading-5 text-[var(--text-soft)]"><ShieldCheck size={15} className="shrink-0"/>{notice}</p>:null}
  {notice&&results.length===0?<p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">No matching cached fares for these dates.</p>:null}
  {results.length>0?<div>
   <h3 className="text-base font-semibold">Observed fares · {results.length}</h3>
   <div role="region" aria-label="Flight observations — swipe sideways" tabIndex={0}
    className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {results.map((fare,index)=><article key={fare.id+"-"+index}
     className="flex w-[44vw] min-w-[152px] max-w-[190px] shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <PlaneTakeoff size={22} className="text-[var(--gold)]"/>
      <h4 className="mt-2 text-base font-bold">{fare.origin} → {fare.destination}</h4>
      <p className="mt-2 text-lg font-bold">₹{fare.price.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs text-[var(--text-soft)]">{fare.airlineCode||"Airline not reported"}</p>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-soft)]"><CalendarDays size={13}/>
        {fare.departureAt.slice(0,10)}</p>
      <a href={fare.partnerUrl} target="_blank" rel="noopener noreferrer sponsored" className="mt-auto inline-flex min-h-10 items-center gap-1 pt-3 text-xs font-semibold underline">
       Verify with provider <ArrowUpRight size={13}/></a>
     </article>)}
   </div>
  </div>:null}
 </section>;
}
