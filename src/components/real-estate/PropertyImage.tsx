"use client"
import { useState } from "react"
import { Building2 } from "lucide-react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import styles from "./Listing.module.css"
export default function PropertyImage({ slug, src, alt, className = "" }: { slug: string; src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const media = approvedMedia(slug, src)
  const reviewedInventory = reviewedInventoryMedia(src)
  if ((!media && !reviewedInventory) || failed) return <div className={`${styles.registryPlaceholder} ${className}`}><div className={styles.registryPlaceholderContent}><div className={styles.registryPlaceholderMark}><Building2 size={26} className="gold-text" aria-hidden="true" /></div><p className="font-bold">Project media pending</p><p className="opacity-70 text-sm leading-6 mt-2">No approved listing photo is available. GTH PRO does not substitute unrelated property imagery.</p></div></div>
  const imageUrl = media?.url || String(src)
  return <div className={`relative ${className}`}><img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />{media?.kind === "render" && <span className="gth-badge absolute bottom-2 left-2">Architectural render</span>}{reviewedInventory && !media && <span className="gth-badge absolute bottom-2 left-2">Reviewed listing photo</span>}</div>
}
