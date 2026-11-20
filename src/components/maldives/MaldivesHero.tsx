"use client";

import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import {ArrowRight,Compass,Hotel,Plane,Ship,ShieldCheck} from "lucide-react";

export const MALDIVES_HERO_PHOTOS = [
  {
    url:"https://images.unsplash.com/photo-1688949078626-a358f500e063?auto=format&fit=crop&w=2200&q=80",
    label:"Overwater sanctuary",
    alt:"Aerial view of genuine Maldives overwater villas in a turquoise lagoon",
    credit:"Hamdhulla Shakeeb / Unsplash",
  },
  {
    url:"https://images.unsplash.com/photo-1696580436068-f19c26850e8b?auto=format&fit=crop&w=2200&q=80",
    label:"Dhigurah lagoon",
    alt:"Maldives Dhigurah white-sand coast, palms and clear turquoise lagoon from above",
    credit:"Hoodh Ahmed / Unsplash",
  },
  {
    url:"https://images.unsplash.com/photo-1637576308588-6647bf80944d?auto=format&fit=crop&w=2200&q=80",
    label:"Golden-hour escape",
    alt:"Sunset over a genuine Maldives sea villa and wooden overwater walkway",
    credit:"David Anderson / Unsplash",
  },
] as const;

export type MaldivesStaySelection = {
  checkin:string;checkout:string;adults:number;children:string;currency:string;today:string;
};

const actions=[
  {id:"maldives-stays",label:"Stays & Resorts",Icon:Hotel},
  {id:"maldives-flights",label:"Flights to Malé (MLE)",Icon:Plane},
  {id:"maldives-transfers",label:"Speedboat & Seaplane Transfers",Icon:Ship},
  {id:"maldives-experiences",label:"Maldives Tours",Icon:Compass},
] as const;

export default function MaldivesHero({stay,headingClass}:{
  stay:MaldivesStaySelection;headingClass:string;
}){
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const start=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{
    if(paused||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const id=window.setInterval(()=>setActive(i=>(i+1)%MALDIVES_HERO_PHOTOS.length),6500);
    return ()=>window.clearInterval(id);
  },[paused]);
  function move(end:{x:number;y:number}|null){
    const begin=start.current;start.current=null;
    if(!begin||!end)return;
    const dx=end.x-begin.x,dy=end.y-begin.y;
    if(Math.abs(dx)<55||Math.abs(dx)<=Math.abs(dy)*1.5)return;
    setActive(i=>(i+(dx<0?1:MALDIVES_HERO_PHOTOS.length-1))%MALDIVES_HERO_PHOTOS.length);
  }
  const input="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--gold)]";
  return <section aria-label="Maldives Elite Escape hero" className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pt-3 sm:px-6">
    <div className="relative isolate h-[465px] w-full touch-auto overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] sm:h-[520px] lg:h-[575px]"
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
      onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}
      onTouchStart={event=>{const t=event.touches[0];start.current=t?{x:t.clientX,y:t.clientY}:null;}}
      onTouchEnd={event=>{const t=event.changedTouches[0];move(t?{x:t.clientX,y:t.clientY}:null);}}
      onTouchCancel={()=>{start.current=null;}}>
      {MALDIVES_HERO_PHOTOS.map((slide,index)=><div key={slide.url} aria-hidden={active!==index}
        className={"absolute inset-0 transition-opacity duration-700 ease-in-out "+(active===index?"opacity-100":"pointer-events-none opacity-0")}>
        <Image src={slide.url} alt={slide.alt} fill priority={index===0}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1600px"
          className="object-cover object-center"/>
      </div>)}
      <div className="absolute left-3 right-3 top-5 z-10 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 shadow-[var(--shadow)] backdrop-blur-lg sm:left-9 sm:top-10 sm:p-7 lg:max-w-2xl">
        <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.21em] text-[var(--gold)]">
          <ShieldCheck size={16} aria-hidden="true"/> GTH PRO · Private island inspiration
        </p>
        <h1 className={headingClass+" mt-3 text-3xl font-semibold leading-[1.06] tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl"}>
          Maldives Elite Escape
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-soft)] sm:text-base sm:leading-7">
          Overwater horizons. Extraordinary atolls. One considered journey from Malé to your island retreat.
        </p>
        <a href="#maldives-stays" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
          Explore Maldives stays <ArrowRight size={17} aria-hidden="true"/>
        </a>
      </div>
      <div role="group" aria-label="Choose Maldives hero photograph"
        className="absolute bottom-20 left-2 z-10 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/85 p-1 sm:bottom-20 sm:left-8">
        {MALDIVES_HERO_PHOTOS.map((slide,index)=><button key={slide.label} type="button"
          aria-label={"Show "+slide.label} aria-pressed={active===index} onClick={()=>setActive(index)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
          <span aria-hidden="true" className={"block h-2.5 w-2.5 rounded-full border border-[var(--border)] "+(active===index?"bg-[var(--gold)]":"bg-[var(--text-soft)]/30")}/>
        </button>)}
      </div>
      <p className="absolute bottom-5 left-5 z-10 rounded-full border border-[var(--border)] bg-[var(--card)]/85 px-3 py-1 text-[10px] text-[var(--text-soft)] sm:left-9">
        {MALDIVES_HERO_PHOTOS[active].credit} · editorial photography
      </p>
    </div>

    <form id="maldives-elite-stay-search" method="get" action="/maldives-elite-escape/stays"
      aria-label="Search Maldives hotel stays" className="gth-glass-strong relative z-20 mx-2 -mt-14 min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow)] sm:mx-5 sm:p-5 lg:-mt-16">
      <input type="hidden" name="destination" value="Maldives"/>
      <div className="grid min-w-0 grid-cols-2 items-end gap-3 sm:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_.7fr_1fr_.8fr_auto]">
        <label className="col-span-2 min-w-0 text-xs font-semibold text-[var(--text-soft)] sm:col-span-1">
          Destination · fixed
          <span className={input+" flex items-center font-bold text-[var(--text)]"}>Maldives / Malé (MLE)</span>
        </label>
        <label className="min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Check-in
          <input type="date" name="checkin" required min={stay.today} defaultValue={stay.checkin} className={input}/>
        </label>
        <label className="min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Check-out
          <input type="date" name="checkout" required min={stay.today} defaultValue={stay.checkout} className={input}/>
        </label>
        <label className="min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Adults
          <input type="number" name="adults" required min={1} max={20} defaultValue={stay.adults} className={input}/>
        </label>
        <label className="min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Child ages
          <input type="text" name="children" inputMode="numeric" maxLength={23} placeholder="e.g. 5,8" defaultValue={stay.children} className={input}/>
        </label>
        <label className="min-w-0 text-xs font-semibold text-[var(--text-soft)]">
          Currency
          <select name="currency" defaultValue={stay.currency} className={input}>
            {["USD","INR","EUR","GBP","AED","SGD","AUD","CAD","JPY"].map(code=><option key={code} value={code}>{code}</option>)}
          </select>
        </label>
        <button type="submit" className="gth-btn-gold col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold sm:col-span-1 lg:whitespace-nowrap">
          Find stays <ArrowRight size={16} aria-hidden="true"/>
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
        The island is locked to Maldives. Direct supplier listings require a verified place match; final rooms, taxes and prices appear only with the booking provider.
      </p>
    </form>

    <nav aria-label="Maldives sections" className="mx-2 mt-4 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-3 sm:mx-5">
      {actions.map(({id,label,Icon})=><a key={id} href={"#"+id}
        className="gth-glass inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-[var(--border)] px-4 text-xs font-bold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
        <Icon size={15} className="text-[var(--gold)]" aria-hidden="true"/>{label}
      </a>)}
    </nav>
  </section>;
}
