"use client";
import {MARKETPLACE_HERO_SLIDES,isIllustrativeVisual} from "@/lib/destinations/visual-media";


import Image from "next/image";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";

const slides=MARKETPLACE_HERO_SLIDES;


/** Mega Aggregator mobile-only media carousel.
 * Photo backgrounds have no handmade CSS, filters or gradient overlays.
 * The fixed heading is intentionally retained outside the images for legibility.
 */
export default function EcosystemHeroCarousel({embedded=false}:{embedded?:boolean}={}){
  const [active,setActive]=useState(0);
  const [hovered,setHovered]=useState(false);
  const [focused,setFocused]=useState(false);
  const [manualPause,setManualPause]=useState(false);
  const touchStart=useRef<{x:number;y:number}|null>(null);

  useEffect(()=>{
    if(hovered||focused||manualPause||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setInterval(()=>setActive(index=>(index+1)%slides.length),5500);
    return ()=>window.clearInterval(timer);
  },[hovered,focused,manualPause,active]);

  function swipe(end:{x:number;y:number}|null){
    const start=touchStart.current;
    touchStart.current=null;
    if(!start||!end)return;
    const dx=end.x-start.x,dy=end.y-start.y;
    // A vertical gesture must remain browser-owned scrolling, not a slide change.
    if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy)*1.25)return;
    setActive(index=>(index+(dx<0?1:slides.length-1))%slides.length);
  }

  return (
    <section aria-labelledby={embedded?undefined:"ecosystem-mobile-hero-title"} aria-label={embedded?"Featured GTH PRO journeys":undefined} className={"mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 "+(embedded?"":"xl:hidden")}>
      {!embedded&&<div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">GTH PRO · Global Ecosystem</p>
        <h1 id="ecosystem-mobile-hero-title" className="mt-2 max-w-2xl text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
          Your world. One connected gateway.
        </h1>
      </div>}
      <div data-app-hero-image={embedded?"true":undefined} className={"relative w-full touch-auto overflow-hidden rounded-2xl border border-[var(--border)] "+(embedded?"aspect-[16/9] max-h-[320px] sm:aspect-[21/9]":"aspect-[2/1] sm:aspect-[21/9]")}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}
        onTouchStart={event=>{const p=event.touches[0];touchStart.current=p?{x:p.clientX,y:p.clientY}:null;}}
        onTouchEnd={event=>{const p=event.changedTouches[0];swipe(p?{x:p.clientX,y:p.clientY}:null);}}
        onTouchCancel={()=>{touchStart.current=null;}}>
        {slides.map((slide,index)=>(
          <div key={slide.name} data-hero-slide={slide.name} aria-hidden={active!==index}
            className={"absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none "+(active===index?"opacity-100":"opacity-0")}>
            {(index===active||index===(active+1)%slides.length||index===(active+slides.length-1)%slides.length)&&<Image src={slide.image} alt="" fill
              priority={index===0} unoptimized={slide.image.endsWith(".webp")} sizes={embedded?"(max-width:640px) 100vw, 1200px":"(max-width:640px) 100vw, (max-width:1280px) 90vw, 1px"}
              className="object-cover object-center" />}
          </div>
        ))}
        <div className="absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2"><Link data-hero-module-link="true" href={slides[active].href} prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm font-semibold text-[var(--text)]">Open {slides[active].name} hub <span aria-hidden="true">↗</span></Link><button type="button" aria-label={manualPause?"Resume automatic hero":"Pause automatic hero"} aria-pressed={manualPause} onClick={()=>setManualPause(v=>!v)} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-xs text-[var(--text)]">{manualPause?"Play":"Pause"}</button></div>
        {isIllustrativeVisual(slides[active].image)&&<span className="absolute top-14 right-2 z-10 rounded bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span>}
        <div role="group" aria-label="Select ecosystem hero image"
          className={"absolute left-1/2 z-10 flex max-w-full -translate-x-1/2 items-center gap-0 "+(embedded?"bottom-10":"bottom-14")}>
          {slides.map((slide,index)=>(
            <button type="button" key={slide.name} aria-label={"Show "+slide.name+" image"}
              aria-pressed={active===index} onClick={()=>setActive(index)}
              className="flex h-9 w-6 sm:w-9 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
              <span className={"h-2.5 w-2.5 rounded-full border border-[var(--border)] "+(active===index?"bg-[var(--gold)]":"bg-[var(--card)]")} aria-hidden="true"/>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
