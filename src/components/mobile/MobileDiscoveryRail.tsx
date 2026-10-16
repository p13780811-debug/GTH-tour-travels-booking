"use client";

import {useId,useRef} from "react";
import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,Building2,ChevronLeft,ChevronRight,FileSearch,Hotel,MapPin} from "lucide-react";
import type {MobileDiscoveryItem,MobileDiscoveryKind} from "@/lib/mobile/discovery";
import {mobileAppHref} from "@/lib/mobile/routes";

const PLACEHOLDER={
  destination:MapPin,hotel:Hotel,property:Building2,tender:FileSearch
};
const labels:Record<MobileDiscoveryKind,string>={
  destination:"Destination guide",hotel:"Directory listing",property:"Property record",tender:"Official notice"
};
/** One consistent 44vw card proportion and horizontal snap rail for all PWA discovery categories. */
export default function MobileDiscoveryRail({heading,description,href,items,kind,appLinks=false}:{
 heading:string;description:string;href:string;items:MobileDiscoveryItem[];kind:MobileDiscoveryKind;appLinks?:boolean;
}){
 const rail=useRef<HTMLDivElement>(null);
 const id=useId();
 const Icon=PLACEHOLDER[kind];
 const destination=appLinks?mobileAppHref(href):href;
 function move(direction:-1|1){
   const el=rail.current;
   if(!el)return;
   const first=el.querySelector<HTMLElement>("article");
   const amount=(first?.offsetWidth??175)+12;
   el.scrollBy({left:direction*amount*2,behavior:"smooth"});
 }
 return <section aria-labelledby={id} className="min-w-0 py-4 sm:py-7">
   <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-6">
     <div className="min-w-0">
       <h2 id={id} className="text-[17px] font-semibold leading-6 tracking-tight sm:text-xl">{heading}</h2>
       <p className="mt-1 text-[11px] leading-4 text-[var(--text-soft)]">{description}</p>
     </div>
     <Link href={destination} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text)]" aria-label={"View all "+heading}>
       View all <ArrowUpRight size={15} aria-hidden="true"/>
     </Link>
   </div>
   {items.length===0?
     <div className="mx-4 flex min-h-28 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6">
       <Icon size={24} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
       <p className="text-sm leading-6 text-[var(--text-soft)]">No verified records to preview in this section yet. Explore the full listings for current search results.</p>
     </div>:
     <>
       <div ref={rail} role="region" aria-roledescription="carousel" aria-label={heading+" — swipe horizontally"}
         tabIndex={0} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth px-4 pb-3 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-6">
         {items.map((item,i)=><article key={item.id}
           role="group" aria-roledescription="slide" aria-label={String(i+1)+" of "+items.length}
           className="gth-glass flex w-[44vw] min-w-[144px] max-w-[188px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] sm:w-[218px] sm:max-w-[218px]">
            <Link href={appLinks?mobileAppHref(item.href):item.href} className="group flex h-full min-h-0 flex-col" aria-label={"Explore "+item.title}>
              <div className="relative h-[112px] w-full overflow-hidden bg-[var(--bg-soft)] sm:h-[132px]">
                {item.image ? <Image src={item.image} alt={kind==="destination"?item.title+" destination":item.title+" listing"}
                    fill sizes="(max-width:640px) 44vw,218px" className="object-cover transition-transform duration-300 group-hover:scale-105"/>:
                 <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--bg)] text-[var(--text-soft)]">
                   <Icon size={34} strokeWidth={1.4} className="text-[var(--gold)]" aria-hidden="true"/>
                   <span className="max-w-[90%] text-center text-[10px] font-medium">{kind==="hotel"?"No licensed photo":kind==="property"?"Registry record":kind==="tender"?"Public procurement":"Destination"}</span>
                 </div>}
                <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-md bg-[var(--card)]/90 px-2 py-1 text-[10px] font-semibold text-[var(--text)]">
                  {kind==="destination"?"Explore":kind==="hotel"?"Stay":kind==="property"?"Property":"Tender"}
                </span>
              </div>
              <div className="flex min-h-[105px] flex-1 flex-col px-3 pb-3 pt-3 sm:min-h-[116px]">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="line-clamp-2 min-h-7 text-[13px] font-semibold leading-[18px] sm:text-sm">{item.title}</h3>
                  <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
                </div>
                <p className="mt-2 line-clamp-1 text-[11px] leading-4 text-[var(--text-soft)]">{item.subtitle||labels[kind]}</p>
                <p className="mt-auto line-clamp-1 pt-2 text-[11px] leading-4 text-[var(--text-soft)]">{item.detail}</p>
              </div>
            </Link>
           </article>)}
         <Link href={destination} className="flex w-[116px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 text-center text-xs font-semibold">
           <ArrowUpRight size={25} className="text-[var(--gold)]" aria-hidden="true"/> View all {heading.toLowerCase()}
         </Link>
       </div>
       <div className="mt-1 flex items-center justify-between px-4 sm:px-6">
         <p className="text-[10px] text-[var(--text-soft)]">Swipe sideways to explore · {items.length} previews</p>
         <div className="flex gap-2">
           <button type="button" onClick={()=>move(-1)} aria-label={"Scroll "+heading+" left"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"><ChevronLeft size={16}/></button>
           <button type="button" onClick={()=>move(1)} aria-label={"Scroll "+heading+" right"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"><ChevronRight size={16}/></button>
         </div>
       </div>
     </>}
 </section>;
}
