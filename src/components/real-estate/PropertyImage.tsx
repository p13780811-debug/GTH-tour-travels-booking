"use client"
import { useState } from "react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
export default function PropertyImage({ slug, src, alt, className = "" }: { slug: string; src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const media = approvedMedia(slug, src)
  const reviewedInventory = reviewedInventoryMedia(src)
  if ((!media && !reviewedInventory) || failed) return <div className={`gth-glass flex items-center justify-center text-center p-4 ${className}`}><span className="opacity-70 text-sm">Property photos not available</span></div>
  const imageUrl = media?.url || String(src)
  return <div className={`relative ${className}`}><img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />{media?.kind === "render" && <span className="gth-badge absolute bottom-2 left-2">Architectural render</span>}{reviewedInventory && !media && <span className="gth-badge absolute bottom-2 left-2">Reviewed listing photo</span>}</div>
}
