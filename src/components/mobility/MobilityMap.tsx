"use client";

import {useEffect,useRef,useState} from "react";
import {mobilityText,type MobilityCity} from "@/lib/mobility/city";
import type {MapKind,MobilityMapData} from "@/lib/mobility/osm";

const layers:ReadonlyArray<{kind:MapKind;label:string;term:string}>=[
  {kind:"roadwork",label:"Mapped road construction",term:"road construction"},
  {kind:"camera",label:"Mapped speed cameras",term:"speed camera"},
  {kind:"transit",label:"Mapped transit hubs",term:"train station"},
];

export default function MobilityMap({city}:{city:MobilityCity}){
  const panel=useRef<HTMLElement>(null);
  const [opened,setOpened]=useState(false);
  const [data,setData]=useState<MobilityMapData|null>(null);
  const [failed,setFailed]=useState(false);
  const [refresh,setRefresh]=useState(false);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!panel.current||!window.IntersectionObserver)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setOpened(true);observer.disconnect();}
    });
    observer.observe(panel.current);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!opened)return;
    const controller=new AbortController();
    setLoading(true);
    setFailed(false);
    const timeout=window.setTimeout(()=>controller.abort("timeout"),24000);
    fetch("/api/mobility/map?"+new URLSearchParams({city:city.slug,...(refresh?{refresh:"1"}:{})}),{signal:controller.signal})
      .then(response=>response.json()).then(result=>{
        if(controller.signal.aborted)return;
        if(result.state==="available")setData(result);
        else setFailed(true);
      }).catch(()=>{if(!controller.signal.aborted||controller.signal.reason==="timeout"){setFailed(true);setLoading(false);}})
      .finally(()=>{window.clearTimeout(timeout);if(!controller.signal.aborted)setLoading(false);});
    return ()=>{window.clearTimeout(timeout);controller.abort();};
  },[opened,city.slug,refresh]);

  return <section ref={panel} aria-labelledby="mobility-map-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <h2 id="mobility-map-heading" className="text-xl font-bold">Road and transit map · {city.name}</h2>
    <p className="mt-2 text-sm text-[var(--text-soft)]">Mapped infrastructure and construction come from OpenStreetMap. Check official local information for current restrictions and service status.</p>
    {!opened&&<button type="button" className="gth-btn mt-2 min-h-11 rounded-xl px-3 text-sm" onClick={()=>setOpened(true)}>Load mapped features</button>}
    <p role="status" className="mt-2 text-sm text-[var(--text-soft)]">{data?
      (data.source==="dated-osm-extract"?"Dated OpenStreetMap extract · ":"Source map snapshot · ")+new Date(data.updatedAt).toLocaleDateString()+(data.source==="dated-osm-extract"?" · Not live traffic":"") :
      failed?"Mapped features are temporarily unavailable here. You can still explore the city map and operator links." :
      opened?"Checking mapped features…":"Explore the map by category."}</p>
    {data?.source==="dated-osm-extract"&&!refresh&&<button type="button" className="gth-btn mt-2 min-h-11 rounded-xl px-3 text-sm" disabled={loading} onClick={()=>setRefresh(true)}>Check for newer mapped features</button>}
    {refresh&&loading&&<p role="status" className="text-sm text-[var(--text-soft)]">Checking for a newer map snapshot…</p>}
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {layers.map(({kind,label,term})=>{
        const items=data?.features.filter(item=>item.kind===kind).slice(0,6)??[];
        const query=new URLSearchParams({query:[term,city.name,city.country].filter(Boolean).join(", ")});
        return <article key={kind} className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3">
          <h3 className="font-semibold">{label}</h3>
          {items.length>0&&<ul className="mt-1">
            {items.map(item=><li key={item.href}><a href={item.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm underline">{mobilityText(item.name,100)||label}</a></li>)}
          </ul>}
          <a className="inline-flex min-h-11 items-center text-sm font-semibold underline" href={"https://www.openstreetmap.org/search?"+query}
            target="_blank" rel="noopener noreferrer">Explore {city.name} on the map</a>
        </article>;
      })}
    </div>
    <a className="mt-2 inline-flex min-h-11 items-center text-xs underline" href="https://www.openstreetmap.org/copyright"
      target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
    {data?.source==="dated-osm-extract"&&<a className="ml-3 inline-flex min-h-11 items-center text-xs underline" href="https://download.bbbike.org/osm/bbbike/Bombay/" target="_blank" rel="noopener noreferrer">Extract by BBBike · ODbL</a>}
  </section>;
}
