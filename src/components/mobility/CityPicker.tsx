"use client";

import {useRef,useState} from "react";
import Link from "next/link";
import {Search} from "lucide-react";
import {MOBILITY_CITIES,mobilityCityKey,mobilityHref,mobilityText,type MobilityCity} from "@/lib/mobility/city";

export default function CityPicker({city}:{city:MobilityCity}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<MobilityCity[]|null>(null);
  const [status,setStatus]=useState("");
  const active=useRef(0);

  async function search(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const prefix=mobilityText(query,70);
    if(prefix.length<2){setStatus("Enter at least two letters of a city name.");return;}
    const request=++active.current;
    setStatus("Searching the destination catalog…");
    setResults(null);
    try{
      const response=await fetch("/api/mobility/cities?"+new URLSearchParams({q:prefix}),
        {signal:AbortSignal.timeout(6500)});
      if(!response.ok)throw new Error("City search unavailable");
      const body=await response.json() as {cities:MobilityCity[];degraded:boolean};
      if(request!==active.current)return;
      setResults(body.cities);
      setStatus(body.degraded?"Some destination results are temporarily unavailable.":body.cities.length?"":"No matching city. Try a shorter prefix.");
    }catch{
      if(request===active.current)setStatus("City search is temporarily unavailable. Choose a featured city or try again.");
    }
  }

  const selected=mobilityCityKey(city);
  return <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5" aria-labelledby="mobility-city-title">
    <h2 id="mobility-city-title" className="text-lg font-bold">Choose a city</h2>
    <form onSubmit={search} role="search" className="mt-3 flex flex-wrap gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">City name</span>
        <input name="q" type="search" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} minLength={2} maxLength={70} required placeholder="Search worldwide destinations" className="gth-input min-h-11 w-full min-w-0"/>
      </label>
      <button className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold" type="submit"><Search size={15} aria-hidden="true"/> Search cities</button>
    </form>
    {status&&<p className="mt-2 text-sm text-[var(--text-soft)]" role="status">{status}</p>}
    <nav aria-label={results?"Matching cities":"Featured cities"} className="mt-3 flex flex-wrap gap-2">
      {(results??MOBILITY_CITIES).map(option=>{
        const key=mobilityCityKey(option);
        return <Link key={key} prefetch={false} href={mobilityHref(option)} aria-current={key===selected?"page":undefined}
          className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold ${key===selected?"gth-btn-gold":"gth-btn"}`}>
          {option.name}{results&&option.country?", "+option.country:""}
        </Link>;
      })}
    </nav>
  </section>;
}
