"use client"

import Image from "next/image"
import {ArrowUpRight} from "lucide-react"
import {partnerSearchHref} from "@/lib/travel/partner-search"
import PortalCarousel from "./PortalCarousel"

// GTH-designed promotions use the existing verified campaign handoff, not retired banner embeds.
const promotions=[
  {id:"mumbai-tours",title:"Explore Mumbai tours",description:"Find sightseeing and tour options for your next city visit.",kind:"tours",destination:"Mumbai",image:"/images/cities/mumbai.jpg"},
  {id:"london-activities",title:"Discover London activities",description:"Explore attractions and experiences through our booking partner.",kind:"activities",destination:"London",image:"/images/cities/london.jpg"},
  {id:"dubai-transfers",title:"Plan your Dubai airport transfer",description:"Search transfer options for your next arrival or departure.",kind:"transfers",destination:"Dubai",image:"/images/cities/dubai.jpg"},
] as const

export default function CampaignPromotions({slot}:{slot:"discovery"|"planning"}) {
  const ordered=slot==="discovery"?promotions:[...promotions.slice(1),promotions[0]]
  const slides=ordered.flatMap(item=>{
    const href=partnerSearchHref(item.kind,item.destination)
    if(!href)return []
    return [{id:item.id,label:item.title,content:<a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label={`${item.title} on Klook (opens in a new tab)`} className="relative block min-h-44 overflow-hidden rounded-2xl">
      <Image src={item.image} alt={`${item.destination} destination imagery`} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover"/>
      <div className="gth-glass relative m-3 max-w-lg rounded-xl p-4"><p className="text-xs font-semibold">Klook · Partner search</p><h3 className="mt-1 text-xl font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6">{item.description}</p><span className="gth-btn mt-3 inline-flex min-h-11 items-center gap-2">Explore options<ArrowUpRight size={15}/></span></div>
    </a>}]
  })
  return <section aria-label={`Travel affiliate promotions ${slot}`} className="mt-8">
    <p className="mb-2 text-xs font-semibold">ADVERTISEMENT · Travelpayouts affiliate promotions</p>
    <PortalCarousel label={`Travel offers ${slot}`} slides={slides}/>
    <p className="mt-1 text-xs opacity-70">GTH PRO promotion designs with tracked partner links. We may earn a commission; partner prices, availability and terms apply.</p>
  </section>
}
