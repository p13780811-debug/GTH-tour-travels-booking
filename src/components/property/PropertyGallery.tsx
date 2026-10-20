"use client"
import { useState } from "react"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import { publishedMediaUrl, type PublishedMedia } from "@/lib/real-estate/published-media"
import PropertyImage from "@/components/real-estate/PropertyImage"

type Props={slug:string;title:string;image?:string;gallery?:string[];
 district?:string;locality?:string;propertyType?:string;reraId?:string;
 publishedMedia?:PublishedMedia[]}

export default function PropertyGallery(props:Props) {
 const [selected,setSelected]=useState(0)
 const approved=(props.publishedMedia||[]).filter(item=>Boolean(publishedMediaUrl(item.id)))
 const legacy=[props.image,...(props.gallery||[])].filter((v):v is string=>typeof v==="string"&&Boolean(approvedMedia(props.slug,v)))
 const sources: {key:string; src?:string; media?:PublishedMedia; description:string}[]=[
  ...approved.map(item=>({key:item.id,media:item,description:item.media_type==="render"?"Architectural render":item.media_type==="floor_plan"?"Floor plan":"Project photo"})),
  ...legacy.filter((url,i)=>legacy.indexOf(url)===i).map(url=>({key:url,src:url,description:"Reviewed property photograph"}))
 ]
 const item=sources[Math.min(selected,Math.max(0,sources.length-1))]
 return <section aria-label="Property gallery" className="gth-glass overflow-hidden rounded-3xl">
  <PropertyImage key={item?.key||props.slug} slug={props.slug} published={item?.media} src={item?.src}
    alt={`${props.title}${item?` — ${item.description}`:""}`}
    district={props.district} locality={props.locality}
    propertyType={props.propertyType} reraId={props.reraId}
    className="h-[280px] w-full md:h-[440px]" />
  {sources.length>1&&<div className="flex gap-2 overflow-x-auto p-3" aria-label="Approved media thumbnails">
   {sources.map((media,i)=><button type="button" key={media.key}
     aria-pressed={item?.key===media.key} aria-label={`View ${media.description.toLowerCase()} ${i+1}`}
     onClick={()=>setSelected(i)}
     className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-[var(--card)] p-0 shadow-none ${item?.key===media.key?"border-[var(--gold)]":"border-[var(--border)]"}`}>
     <PropertyImage slug={props.slug} published={media.media} src={media.src}
       alt={`${props.title} — ${media.description}`} className="h-full w-full"/>
   </button>)}
  </div>}
  {sources.length>0&&item?.media?.attribution&&
    <p className="px-4 text-xs text-[var(--text-muted)]">Image attribution: {item.media.attribution}</p>}
  <p className="px-4 py-3 text-xs leading-6 text-[var(--text-muted)]">
   {sources.length?"Images are published only after independent rights and project-matching review. Renders and floor plans are labelled.":"No approved project-specific photographs are published for this record. Consult the official project source or request reviewed media."}
  </p>
 </section>
}
