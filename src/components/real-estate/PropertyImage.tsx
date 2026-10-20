"use client"
import { useState } from "react"
import { Building2 } from "lucide-react"
import { approvedMedia } from "@/lib/real-estate/approved-media"
import { publishedMediaUrl, type PublishedMedia } from "@/lib/property-media/published-media"

type Props = {
 slug: string; src?: string; published?: PublishedMedia; alt: string; className?: string;
 district?: string; locality?: string; propertyType?: string; reraId?: string;
}
/** Project ID bound, independently published media only. Never infer approval from a CDN URL. */
export default function PropertyImage({slug,src,published,alt,className="",district="",locality="",propertyType="",reraId}:Props) {
 const [failed,setFailed]=useState<string[]>([])
 const reviewed=approvedMedia(slug,src)
 const url=published ? publishedMediaUrl(published.id) : reviewed?.url||""
 const visible=Boolean(url&&!failed.includes(url))
 const label=published?.media_type==="render"||reviewed?.kind==="render"?
   "Approved architectural render":published?.media_type==="floor_plan"?
   "Approved project floor plan":"Reviewed project photo"
 return <div className={`relative isolate min-w-0 overflow-hidden bg-[var(--bg-soft)] ${className}`}>
  {visible ? <>
   <img key={url} src={url} alt={alt} loading="lazy" decoding="async"
    className="block h-full w-full object-cover"
    onError={()=>setFailed(old=>[...old,url])}/>
   <span className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-16px)] rounded bg-[var(--card)] px-2 py-1 text-[10px] leading-4 text-[var(--text)]">{label}</span>
  </> : <div role="img" aria-label={`Project record for ${alt}. No approved photograph available.`}
   className="flex h-full min-h-40 w-full flex-col justify-end gap-2 border-b border-[var(--border)] bg-[var(--bg-soft)] p-4 pt-14 text-[var(--text)]">
   <strong className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">{alt}</strong>
   <span className="line-clamp-1 text-[11px] text-[var(--text-muted)]">{reraId?`RERA ${reraId}`:locality||district||propertyType||"Property record"}</span>
   <span className="inline-flex items-center gap-2 text-[10px] font-medium text-[var(--text-muted)]"><Building2 size={14} aria-hidden="true"/>Project photo not available</span>
  </div>}
 </div>
}
