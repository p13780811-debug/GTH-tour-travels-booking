"use client";

import Link from "next/link";
import {useState} from "react";
import scroll from "./TravelScroll.module.css";
import {usePathname} from "next/navigation";
import {BookOpen, BusFront, CarFront, Compass, Hotel, MapPinned, Plane, Route, Ticket, TrainFront, Newspaper, Landmark, ShieldCheck} from "lucide-react";

/**
 * Shared secondary navigation across travel categories and their detail pages.
 * Uses the existing GTH PRO CSS tokens; the approved global navbar remains intact.
 */
export const TRAVEL_SECTIONS = [
  {href:"/flights",label:"Flights",Icon:Plane},
  {href:"/hotels",label:"Hotels",Icon:Hotel},
  {href:"/tours",label:"Tours",Icon:Compass},
  {href:"/activities",label:"Activities",Icon:Ticket},
  {href:"/attractions",label:"Attractions",Icon:Landmark},
  {href:"/destinations",label:"Destinations",Icon:MapPinned},
  {href:"/guides",label:"Guides",Icon:BookOpen},
  {href:"/blog",label:"Travel blog",Icon:Newspaper},
  {href:"/transfers",label:"Transfers",Icon:Route},
  {href:"/cars",label:"Car rentals",Icon:CarFront},
  {href:"/bus",label:"Buses",Icon:BusFront},
  {href:"/train",label:"Trains",Icon:TrainFront},
  {href:"/insurance",label:"Insurance",Icon:ShieldCheck},
] as const;

export default function TravelSectionNav(){
 const pathname=usePathname()||"";
 const [opening,setOpening]=useState<{href:string;from:string}|null>(null);
 const inProgress=opening?.from===pathname?opening:null;
 const active=TRAVEL_SECTIONS.find(section=>
   pathname===section.href||pathname.startsWith(section.href+"/")
 );
 return (
  <div className="border-b border-[var(--border)] bg-[var(--card)] text-[var(--text)]">
    <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 py-2 sm:px-6">
      <span className="hidden shrink-0 text-xs font-bold tracking-wide text-[var(--text-soft)] lg:block">
        GTH PRO Travel
      </span>
      <nav aria-label="Browse GTH PRO travel categories"
        className={"min-w-0 flex-1 overflow-x-auto overscroll-x-contain "+scroll.strip}>
        <div className="flex w-max min-w-full items-center gap-1.5">
          {TRAVEL_SECTIONS.map(({href,label,Icon})=>{
            const isActive=active?.href===href;
            return <Link key={href} href={href} onClick={()=>{if(!isActive)setOpening({href,from:pathname});}} aria-current={isActive?"page":undefined}
              className={"inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] "+
                (isActive?"border-[var(--gold)] bg-[var(--bg)] text-[var(--text)]":"border-transparent text-[var(--text-soft)] hover:border-[var(--border)] hover:bg-[var(--bg)]")}>
              <Icon size={15} aria-hidden="true"/>{label}
            </Link>;
          })}
        </div>
      </nav>
      <Link href="/mega-aggregator" className="hidden shrink-0 text-xs font-semibold text-[var(--text)] underline-offset-4 hover:underline xl:block">
        All services
      </Link>
    </div>
    {inProgress&&<p role="status" aria-live="polite" className="mx-auto max-w-7xl px-4 pb-2 text-xs text-[var(--text-soft)] sm:px-6">Opening {TRAVEL_SECTIONS.find(item=>item.href===inProgress.href)?.label||"travel page"}…</p>}
  </div>
 );
}
