"use client"

import Image from "next/image"
import {ArrowUpRight} from "lucide-react"
import {partnerSearchHref} from "@/lib/travel/partner-search"
import PortalCarousel from "./PortalCarousel"

// Preserve the approved, validated campaign handoff for partner offers.
// Hotel promotion enters GTH PRO's existing white-label search, never an
// unverified affiliate URL or unsupported sandbox booking API.
const discoveryPromotions=[
  {id:"mumbai-tours",title:"Explore Mumbai tours",description:"Find sightseeing and tour options for your next city visit.",kind:"tours",destination:"Mumbai",image:"/images/cities/mumbai.jpg"},
  {id:"london-activities",title:"Discover London activities",description:"Explore attractions and experiences through our booking partner.",kind:"activities",destination:"London",image:"/images/cities/london.jpg"},
  {id:"dubai-transfers",title:"Plan your Dubai airport transfer",description:"Search transfer options for your next arrival or departure.",kind:"transfers",destination:"Dubai",image:"/images/cities/dubai.jpg"},
] as const

const footerPromotions=[
  {id:"worldwide-hotels",title:"Discover hotels & stays",description:"Search accommodation through GTH PRO's existing hotel booking experience.",kind:"hotels",destination:"Worldwide",image:"/images/travel.jpg"},
  {id:"airport-transfers",title:"Explore Singapore airport transfers",description:"Compare transfer options for your Singapore arrival or departure.",kind:"transfers",destination:"Singapore",image:"/images/cities/singapore.jpg"},
  {id:"car-rentals",title:"Find a rental car",description:"Explore rental car options for your London journey.",kind:"cars",destination:"London",image:"/images/cities/london.jpg"},
] as const

export default function CampaignPromotions({slot}:{slot:"discovery"|"planning"}) {
  const promotions=slot==="discovery"?discoveryPromotions:footerPromotions
  const slides=promotions.flatMap(item=>{
    const isHotel=item.kind==="hotels"
    const href=isHotel?"/hotels":partnerSearchHref(item.kind,item.destination)
    if(!href)return []
    return [{id:item.id,label:item.title,content:<a href={href}
      {...(isHotel?{}:{target:"_blank",rel:"sponsored nofollow noopener noreferrer"})}
      aria-label={isHotel?`${item.title} on GTH PRO`:`${item.title} on Klook (opens in a new tab)`}
      className="relative block min-h-44 overflow-hidden rounded-2xl">
      <Image src={item.image} alt={`${item.destination} destination imagery`} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover"/>
      <div className="gth-glass relative m-3 max-w-lg rounded-xl p-4">
        <p className="text-xs font-semibold">{isHotel?"GTH PRO · Hotel search":"Klook · Partner search"}</p>
        <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm leading-6">{item.description}</p>
        <span className="gth-btn mt-3 inline-flex min-h-11 items-center gap-2">Explore options<ArrowUpRight size={15}/></span>
      </div>
    </a>}]
  })
  return <section aria-label={`Travel promotions ${slot}`} className="mt-8">
    <PortalCarousel label={`Travel offers ${slot}`} showControls={false} slides={slides}/>
    <p className="mt-2 text-xs opacity-70">GTH PRO travel promotions. Some links are tracked affiliate referrals and may earn a commission. Partner prices, availability and terms apply.</p>
  </section>
}
