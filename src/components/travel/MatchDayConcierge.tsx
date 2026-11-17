"use client";
import {useEffect,useState} from "react";
type Data={venue:string;transit:string;bookingUrl:string;hotels:{name:string;distanceKm:number;sourceUrl:string}[];note?:string};
export default function MatchDayConcierge({slug,name,bookingUrl}:{slug:string;name:string;bookingUrl:string}){
 const [data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();fetch("/api/stadiums/concierge?"+new URLSearchParams({venue:slug}),{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then((d:Data)=>setData(d)).catch(()=>{}).finally(()=>setLoading(false));return()=>controller.abort();},[slug]);
 const hotels=data?.hotels||[];
 const checklist=["Check event date, admission ticket, stand and entry gate","Review bag, ID, accessibility and prohibited-items rules","Check official weather forecast and carry suitable rain/sun protection","Confirm metro, shuttle, road closures and last service","Allow extra time; check hotel availability and cancellation terms"];
 function printGuide(){
  const w=window.open("","_blank","width=800,height=900");
  if(!w)return;
  const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
  const safeUrl=(()=>{try{const u=new URL(data?.bookingUrl||bookingUrl);return u.protocol==="https:"&&u.hostname==="gthproglobal.nuitee.link"?u.toString():"https://gthproglobal.nuitee.link/";}catch{return "https://gthproglobal.nuitee.link/";}})();
  w.document.write('<!doctype html><html><head><title>Match-Day Pocket Guide</title><meta charset="utf-8"><style>body{font:16px system-ui;max-width:760px;margin:40px auto;line-height:1.6}h1,h2{margin-bottom:8px}li{margin:8px 0}</style></head><body><h1>'+esc(name)+' — Match-Day Pocket Guide</h1><h2>Transit</h2><p>'+esc(data?.transit||"Confirm venue transit and gate details")+'</p><h2>Checklist</h2><ul>'+checklist.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><h2>Nearby OSM stays</h2><ol>'+hotels.map(h=>'<li>'+esc(h.name)+' ('+h.distanceKm+' km straight line)</li>').join("")+'</ol><p>Hotel listings are directory data, not guaranteed bookable inventory or walking distances.</p><p><a href="'+esc(safeUrl)+'">Search hotels on GTH PRO booking partner</a></p><p>Confirm all event details with the organizer.</p></body></html>');
  w.document.close();w.focus();w.print();
 }
 return <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-5 sm:p-7" aria-label="Match-day fan concierge">
  <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Match-Day Fan Concierge</p>
  <h2 className="mt-2 text-2xl font-bold">Your {name} match-day plan</h2>
  <div className="mt-4 grid gap-5 md:grid-cols-2">
   <div><h3 className="font-semibold">Nearest transit / entry tip</h3><p className="mt-2 text-sm text-[var(--text-soft)]">{data?.transit||"Confirm the venue's official transit and gate notices."}</p>
    <h3 className="mt-5 font-semibold">Weather & match-day checklist</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-soft)]">{checklist.map(item=><li key={item}>{item}</li>)}</ul>
    <p className="mt-2 text-xs text-[var(--text-soft)]">No live weather API used. Check an official forecast before departure.</p>
   </div>
   <div><h3 className="font-semibold">Up to 5 nearby directory stays (within 5 km)</h3>
    {loading?<p role="status" className="mt-2 text-sm">Checking available OSM hotel records…</p>:hotels.length?<ol className="mt-3 space-y-3">{hotels.map((hotel,i)=><li key={hotel.name+i} className="rounded-xl border border-[var(--border)] p-3 text-sm"><strong>{i+1}. {hotel.name}</strong><p>{hotel.distanceKm.toFixed(2)} km straight-line distance</p>{hotel.sourceUrl&&<a className="underline" href={hotel.sourceUrl} target="_blank" rel="noopener noreferrer">OSM source</a>}</li>)}</ol>:<p className="mt-3 text-sm">No nearby OSM accommodation records available. Search the city on the booking partner.</p>}
    <p className="mt-2 text-xs text-[var(--text-soft)]">{data?.note||"Distances are not walking routes. Booking inventory and rates must be checked separately."}</p>
   </div>
  </div>
  <div className="mt-5 flex flex-wrap gap-3"><a href={data?.bookingUrl||bookingUrl} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4">Find hotels for match day</a><button type="button" onClick={printGuide} className="gth-btn min-h-11">Download Match-Day Pocket Guide / Print PDF</button></div>
  <p className="mt-3 text-xs text-[var(--text-soft)]">Hotel booking is handled by the partner. GTH PRO may receive affiliate commission. No ticket or room availability is implied.</p>
 </section>;
}
