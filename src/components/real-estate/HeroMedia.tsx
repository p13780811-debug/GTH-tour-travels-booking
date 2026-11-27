"use client"
import {LUXURY_VISUALS} from "@/lib/destinations/visual-media";
import Image from "next/image"
import PortalCarousel from "./PortalCarousel"
const scenes=[
  {id:"architecture",label:"Architecture inspiration",src:LUXURY_VISUALS.property},
  {id:"property-story",label:"Property perspectives",src:"/brand/property-story.jpg"},
  {id:"city-living",label:"City living",src:"/images/global-city.jpg"},
] as const
export default function HeroMedia(){
  return <div id="property-hero-media" className="relative mt-3">
    <PortalCarousel label="Property inspiration" showControls={false} slides={scenes.map((scene,index)=>({...scene,content:<div className="relative h-40 sm:h-52 lg:h-64"><Image src={scene.src} alt="" fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority={index===0}/></div>}))}/>
    <p className="mt-1 text-xs text-[var(--text-soft)]">Illustrative brand imagery · Not listed properties</p>
  </div>
}
