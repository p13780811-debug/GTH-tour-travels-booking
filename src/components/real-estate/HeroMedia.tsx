"use client"
import Image from "next/image"
import PortalCarousel from "./PortalCarousel"
const scenes=[
  {id:"architecture",label:"Architecture inspiration",src:"/images/real-estate.jpg"},
  {id:"property-story",label:"Property perspectives",src:"/brand/property-story.jpg"},
  {id:"city-living",label:"City living",src:"/images/global-city.jpg"},
] as const
export default function HeroMedia(){
  return <div id="property-hero-media" className="relative mt-3">
    <PortalCarousel label="Property inspiration" overlayControls slides={scenes.map((scene,index)=>({...scene,content:<div className="relative h-40 sm:h-52 lg:h-64"><Image src={scene.src} alt={`GTH PRO brand visual: ${scene.label}`} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority={index===0}/></div>}))}/>
    <p className="gth-glass pointer-events-none !absolute bottom-10 left-3 rounded px-2 py-1 text-xs">Brand imagery · Not listed properties</p>
  </div>
}
