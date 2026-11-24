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
    const timeout=window.setTimeout(()=>controller.abort("timeout"),17000);
    fetch("/api/mobility/map?"+new URLSearchParams({city:city.slug}),{signal:controller.signal})
      .then(response=>response.json()).then(result=>{
        if(controller.signal.aborted)return;
        if(result.state==="available")setData(result);
        else setFailed(true);
      }).catch(()=>{if(!controller.signal.aborted||controller.signal.reason==="timeout")setFailed(true);})
      .finally(()=>window.clearTimeout(timeout));
    return ()=>{window.clearTimeout(timeout);controller.abort();};
  },[opened,city.slug]);

  return <section ref={panel} aria-labelledby="mobility-map-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <h2 id="mobility-map-heading" className="text-xl font-bold">Road and transit map · {city.name}</h2>
    <p className="mt-2 text-sm text-[var(--text-soft)]">Mapped infrastructure and construction come from OpenStreetMap. Check official local information for current restrictions and service status.</p>
    {!opened&&<button type="button" className="gth-btn mt-2 min-h-11 rounded-xl px-3 text-sm" onClick={()=>setOpened(true)}>Load mapped features</button>}
    <p role="status" className="mt-2 text-sm text-[var(--text-soft)]">{data?
      "Source map snapshot · "+new Date(data.updatedAt).toLocaleDateString() :
      failed?"Mapped features are temporarily unavailable here. You can still explore the city map and operator links." :
      opened?"Checking mapped features…":"Explore the map by category."}</p>
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
  </section>;
}
