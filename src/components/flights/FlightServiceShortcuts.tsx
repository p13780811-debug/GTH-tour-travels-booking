import Link from "next/link";
import {ArrowUpRight,CarFront,Compass,Luggage,Route,ShieldCheck} from "lucide-react";
import {flightServiceCategories} from "@/lib/flights/service-categories";
const icons={"Flight protection":ShieldCheck,"Airport transfers":Route,"Car rentals":CarFront,"Airport essentials":Luggage,"At destination":Compass};
/** Small, horizontally scrollable service links keep the flight form in view. */
export default function FlightServiceShortcuts(){
 return <div role="navigation" aria-label="Flight travel services" className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] sm:px-6">
  {[flightServiceCategories[1],flightServiceCategories[2],flightServiceCategories[0],flightServiceCategories[3],flightServiceCategories[4]].map(service=>{
   const Icon=icons[service.group];
   return <Link key={service.group} href={service.page} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold">
    <Icon size={16} className="text-[var(--gold)]" aria-hidden="true"/>{service.title}<ArrowUpRight size={13} aria-hidden="true"/>
   </Link>;
  })}
 </div>;
}
