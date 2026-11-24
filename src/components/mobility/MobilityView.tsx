import Link from "next/link";
import {ArrowUpRight,BusFront,CarFront,TrainFront} from "lucide-react";
import CityPicker from "@/components/mobility/CityPicker";
import CityMobility from "@/components/mobility/CityMobility";
import DriverTools from "@/components/mobility/DriverTools";
import DriverTraffic from "@/components/mobility/DriverTraffic";
import MobilityMap from "@/components/mobility/MobilityMap";
import {mobilityCityKey,type MobilityCity} from "@/lib/mobility/city";

export default function MobilityView({city,cityPage=false}:{city:MobilityCity;cityPage?:boolean}){
  const key=mobilityCityKey(city);
  const isMumbai=city.countryCode==="IN"&&city.name.toLocaleLowerCase("en")==="mumbai";
  return <main className="min-h-screen bg-[var(--bg)] pb-12 text-[var(--text)]">
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:space-y-9 sm:px-6 sm:py-10">
      <header>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]"><CarFront size={16} aria-hidden="true"/> GTH PRO Mobility</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{cityPage?city.name+" mobility and driver tools":"Local transport & driver tools"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)] sm:text-base">Find transit connections for your city, estimate shift earnings and keep your daily Hisaab in one place.</p>
      </header>
      <CityPicker key={"picker:"+key} city={city}/>
      <DriverTraffic key={"traffic:"+key} city={city}/>
      <DriverTools key={"driver:"+key} city={city}/>
      <CityMobility city={city}/>
      <MobilityMap key={"map:"+key} city={city}/>
      {isMumbai&&<section aria-labelledby="mumbai-local-title" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <h2 id="mumbai-local-title" className="text-xl font-bold">Mumbai local train corridors</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["Western","Churchgate toward Borivali and Virar","https://wr.indianrailways.gov.in/offerings/custom/Mumbai%20Suburban/preview/523"],
            ["Central","CSMT toward Thane and Kalyan","https://cr.indianrailways.gov.in/offerings/schemes-and-services/preview/1122"],
            ["Harbour","CSMT toward Navi Mumbai and Panvel","https://cr.indianrailways.gov.in/offerings/schemes-and-services/preview/1122"],
          ].map(([line,detail,href])=><li key={line} className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3">
            <h3 className="font-semibold">{line} Line</h3><p className="mt-1 text-sm text-[var(--text-soft)]">{detail}</p>
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Check official timetable</a>
          </li>)}
        </ul>
      </section>}
      <section aria-labelledby="mobility-booking" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <h2 id="mobility-booking" className="text-xl font-bold">Intercity tickets and airport transfers</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {([[TrainFront,"Train tickets","/train"],[BusFront,"Bus tickets","/bus"],[CarFront,"Airport transfers","/transfers"]] as const).map(([Glyph,label,href])=><Link key={href} href={href} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold">
              <Glyph size={16} aria-hidden="true"/>{label}<ArrowUpRight size={14} aria-hidden="true"/>
            </Link>)}
        </div>
        <Link href="/affiliate-disclosure" className="mt-1 inline-flex min-h-11 items-center text-xs text-[var(--text-soft)] underline">Affiliate disclosure</Link>
      </section>
    </div>
  </main>;
}
