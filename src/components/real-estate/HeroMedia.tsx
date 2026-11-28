"use client"
import {MODULE_HEROES} from "@/lib/destinations/visual-media";
import Image from "next/image"
import PortalCarousel from "./PortalCarousel"
const scenes=[
  {id:"architecture",label:"Architecture inspiration",src:MODULE_HEROES.property.image},
  {id:"property-story",label:"Property perspectives",src:"/brand/property-story.jpg"},
  {id:"city-living",label:"City living",src:"/images/global-city.jpg"},
] as const
export default function HeroMedia(){
  return <div id="property-hero-media" className="relative mt-3">
    <PortalCarousel label="Property inspiration" showControls={false} slides={scenes.map((scene,index)=>({...scene,content:<div className="relative h-40 sm:h-52 lg:h-64"><Image src={scene.src} alt="" fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority={index===0}/></div>}))}/>
    <p className="sr-only">Brand imagery · Not listed properties</p>
    <span className="absolute bottom-2 left-2 rounded bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span>
  </div>
}
