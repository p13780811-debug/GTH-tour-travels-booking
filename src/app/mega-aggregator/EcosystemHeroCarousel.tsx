"use client";

import Image from "next/image";
import {useEffect,useRef,useState} from "react";

const slides=[
  {name:"Hotels",image:"/images/mega/hotels.jpg",alt:"Modern hotel accommodation"},
  {name:"Flights",image:"/images/mega/flights.jpg",alt:"Air travel and aviation"},
  {name:"Tours",image:"/images/mega/tours.jpg",alt:"Travellers exploring the world"},
  {name:"Real Estate",image:"/images/real-estate.jpg",alt:"Residential and commercial property discovery"},
  {name:"Tenders",image:"/images/tender.jpg",alt:"Business procurement and tender opportunities"},
] as const;

/** Mega Aggregator mobile-only media carousel.
 * Photo backgrounds have no handmade CSS, filters or gradient overlays.
 * The fixed heading is intentionally retained outside the images for legibility.
 */
export default function EcosystemHeroCarousel({embedded=false}:{embedded?:boolean}={}){
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const touchX=useRef<number|null>(null);

  useEffect(()=>{
    if(paused||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setInterval(()=>setActive(index=>(index+1)%slides.length),5500);
    return ()=>window.clearInterval(timer);
  },[paused,active]);

  function swipe(start:number|null,end:number|undefined){
    if(start===null||end===undefined)return;
    const delta=end-start;
    if(Math.abs(delta)<45)return;
    setActive(index=>(index+(delta<0?1:slides.length-1))%slides.length);
  }

  return (
    <section aria-labelledby={embedded?undefined:"ecosystem-mobile-hero-title"} aria-label={embedded?"Featured ecosystem journeys":undefined} className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 xl:hidden">
      {!embedded&&<div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">GTH PRO · Global Ecosystem</p>
        <h1 id="ecosystem-mobile-hero-title" className="mt-2 max-w-2xl text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
          Your world. One connected gateway.
        </h1>
      </div>}
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-[var(--border)] sm:aspect-[21/9]"
        onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
        onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}
        onTouchStart={event=>{touchX.current=event.touches[0]?.clientX??null;}}
        onTouchEnd={event=>{swipe(touchX.current,event.changedTouches[0]?.clientX);touchX.current=null;}}>
        {slides.map((slide,index)=>(
          <div key={slide.name} aria-hidden={active!==index}
            className={"absolute inset-0 transition-opacity duration-700 ease-in-out "+(active===index?"opacity-100":"opacity-0")}>
            <Image src={slide.image} alt={slide.alt} fill
              priority={index===0} sizes="(max-width:640px) 100vw, (max-width:1280px) 90vw, 1px"
              className="object-cover object-center" />
          </div>
        ))}
        <div role="group" aria-label="Select ecosystem hero image"
          className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
          {slides.map((slide,index)=>(
            <button type="button" key={slide.name} aria-label={"Show "+slide.name+" image"}
              aria-pressed={active===index} onClick={()=>setActive(index)}
              className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
              <span className={"h-2.5 w-2.5 rounded-full border border-[var(--border)] "+(active===index?"bg-[var(--gold)]":"bg-[var(--card)]")} aria-hidden="true"/>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
