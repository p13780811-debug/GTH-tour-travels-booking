"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {ArrowRight,ChevronLeft,ChevronRight,Pause,Play} from "lucide-react";
import {appPromotions,type AppPillar} from "@/lib/mobile/app-dashboard";

/** Editorial service promotions. Rotation stops when hidden, focused or reduced-motion is set. */
export default function AppPromoCarousel({pillar}:{pillar:AppPillar}){
 const slides=appPromotions.filter(slide=>pillar==="all"||slide.pillar===pillar);
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[interacting,setInteracting]=useState(false),[requestedPlay,setRequestedPlay]=useState(false);
 const [visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false);
 const root=useRef<HTMLDivElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 const current=index%slides.length;
 const automatic=slides.length>1&&!paused&&(!interacting||requestedPlay)&&!reduced&&visible&&!hidden;
 useEffect(()=>{
  const media=matchMedia("(prefers-reduced-motion: reduce)");
  const sync=()=>setReduced(media.matches),visibility=()=>setHidden(document.hidden);
  sync();visibility();media.addEventListener("change",sync);document.addEventListener("visibilitychange",visibility);
  const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??false),{threshold:0.5});
  if(root.current)observer.observe(root.current);
  return ()=>{observer.disconnect();media.removeEventListener("change",sync);document.removeEventListener("visibilitychange",visibility);};
 },[]);
 useEffect(()=>{
  if(!automatic)return;
  const timer=window.setTimeout(()=>setIndex(value=>(value+1)%slides.length),6000);
  return ()=>window.clearTimeout(timer);
 },[automatic,current,slides.length]);
 function move(value:number){setPaused(true);setRequestedPlay(false);setIndex((value+slides.length)%slides.length);}
 const slide=slides[current];
 return <div ref={root} role="region" aria-roledescription="carousel" aria-label="Featured GTH PRO services"
  onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>{setInteracting(false);setRequestedPlay(false);}}
  onFocusCapture={event=>{setInteracting(true);if(!(event.target as HTMLElement).closest("[data-rotation-control]"))setRequestedPlay(false);}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setInteracting(false);setRequestedPlay(false);}}}
  onTouchStart={event=>{const point=event.touches[0];touch.current=point?{x:point.clientX,y:point.clientY}:null;}}
  onTouchEnd={event=>{const point=event.changedTouches[0],start=touch.current;if(point&&start){const x=point.clientX-start.x,y=point.clientY-start.y;if(Math.abs(x)>40&&Math.abs(x)>Math.abs(y))move(current+(x<0?1:-1));}touch.current=null;}}
  onTouchCancel={()=>{touch.current=null;}}
  className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:mx-6">
   <div aria-live={automatic?"off":"polite"} aria-atomic="true">
    <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`${current+1} of ${slides.length}`} className="grid min-h-44 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
     <div className="flex min-w-0 flex-col items-start p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--gold)]">{slide.eyebrow}</p>
      <h2 className="mt-1 text-lg font-bold leading-tight sm:text-2xl">{slide.title}</h2>
      <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{slide.description}</p>
      <Link href={slide.href} className="mt-auto inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[var(--gold)]">{slide.action}<ArrowRight size={15} aria-hidden="true"/></Link>
     </div>
     <div className="relative min-w-0"><Image key={slide.id} src={slide.image} alt="" fill sizes="(max-width:640px) 38vw,400px" className="object-cover"/></div>
    </div>
   </div>
   <div className="flex min-h-11 items-center justify-between gap-2 border-t border-[var(--border)] px-2">
    <p className="pl-2 text-[10px] text-[var(--text-soft)]">GTH PRO highlights</p>
    <div className="flex items-center">
     {slides.length>1&&<>
      <button type="button" aria-label="Previous promotion" onClick={()=>move(current-1)} className="flex size-11 items-center justify-center"><ChevronLeft size={17}/></button>
      <span className="min-w-8 text-center text-xs tabular-nums" aria-hidden="true">{current+1}/{slides.length}</span>
      <button type="button" aria-label="Next promotion" onClick={()=>move(current+1)} className="flex size-11 items-center justify-center"><ChevronRight size={17}/></button>
      {!reduced&&<button type="button" data-rotation-control="true" aria-label={paused?"Play promotions":"Pause promotions"} onClick={()=>{const stop=!paused;setPaused(stop);setRequestedPlay(!stop);}} className="flex size-11 items-center justify-center">{paused?<Play size={16}/>:<Pause size={16}/>}</button>}
     </>}
    </div>
   </div>
 </div>;
}
