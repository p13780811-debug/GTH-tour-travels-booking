import Link from "next/link";
import {ArrowUpRight,BusFront,Plane,TrainFront,TramFront} from "lucide-react";
import {mobilityHref,type MobilityCity} from "@/lib/mobility/city";
import {transitOptions} from "@/lib/mobility/transit";

const icons={train:TrainFront,metro:TramFront,bus:BusFront,airport:Plane};

export default function CityMobility({city,compact=false}:{city:MobilityCity;compact?:boolean}){
  const modes=transitOptions(city);
  return <section id="city-mobility" aria-labelledby="city-mobility-heading" className={compact?"mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6":"scroll-mt-24"}>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id="city-mobility-heading" className="text-xl font-bold sm:text-2xl">Local transport in {city.name}</h2>
      {compact&&<Link prefetch={false} className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold" href={mobilityHref(city)+"#driver-tools"}>Driver tools &amp; diary</Link>}
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {modes.map(({mode,title,label,href,kind,detail})=>{
        const Icon=icons[mode];
        return <article key={mode} className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <Icon size={20} className="text-[var(--gold)]" aria-hidden="true"/>
          <h3 className="mt-2 font-semibold">{title}</h3>
          <p className="mb-2 mt-1 text-sm leading-6 text-[var(--text-soft)]">{detail}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={title+": "+label}
            className="mt-auto inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline">
            {label}<ArrowUpRight size={14} aria-hidden="true" className="shrink-0"/>
          </a>
          <span className="text-xs text-[var(--text-soft)]">{kind==="official"?"Operator source":"Map search"}</span>
        </article>;
      })}
    </div>
  </section>;
}
