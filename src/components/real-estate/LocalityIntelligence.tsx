"use client";
import {useState} from "react";
import {MapPin, TrainFront, Plane} from "lucide-react";
type Place={name:string;distanceMeters:number;osmUrl:string};
type Result={status:string;metro:Place|null;airport:Place|null;airportDriveMinutes?:number|null;notice:string};
export default function LocalityIntelligence({slug}:{slug:string}){
 const [data,setData]=useState<Result|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 async function load(){
  if(loading)return;setError("");setLoading(true);
  try{
   const response=await fetch("/api/real-estate/locality/"+encodeURIComponent(slug),{cache:"no-store"});
   if(!response.ok)throw Error();
   setData(await response.json() as Result);
  }catch{setError("Connectivity lookup unavailable. Please retry later.")}
  finally{setLoading(false)}
 }
 return <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4" aria-label="Source-backed local connectivity">
  <h3 className="flex items-center gap-2 font-semibold"><MapPin size={17} className="text-[var(--gold)]"/> Locality intelligence</h3>
  <p className="mt-2 text-xs text-[var(--text-soft)]">Free OSM transport lookup is on demand. No verified metro or driving claims without source data. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a>.</p>
  {!data&&<button type="button" className="gth-btn mt-3 min-h-11" disabled={loading} onClick={()=>void load()}>{loading?"Checking recorded coordinates…":"Check nearby metro and airport"}</button>}
  {error&&<p role="status" className="mt-2 text-xs">{error}</p>}
  {data&&<div className="mt-3 space-y-3 text-sm">
   <p className="text-xs text-[var(--text-soft)]">{data.notice}</p>
   {data.metro?<p><TrainFront size={16} className="mr-2 inline text-[var(--gold)]"/><a href={data.metro.osmUrl} target="_blank" rel="noopener noreferrer" className="underline">{data.metro.name}</a> · approx. {Math.round(data.metro.distanceMeters).toLocaleString("en-IN")} m straight-line</p>:<p>Nearby metro: not confirmed from the current lookup.</p>}
   {data.airport?<p><Plane size={16} className="mr-2 inline text-[var(--gold)]"/><a href={data.airport.osmUrl} target="_blank" rel="noopener noreferrer" className="underline">{data.airport.name}</a> · approx. {(data.airport.distanceMeters/1000).toFixed(1)} km straight-line{data.airportDriveMinutes!=null?` · road route estimate ${data.airportDriveMinutes} min`:" · road travel time unavailable"}</p>:<p>Nearby IATA airport: not confirmed from the current lookup.</p>}
  </div>}
 </section>;
}
