"use client"
import { useState } from "react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import { getPropertyVisuals, responsivePhoto, type PropertyVisual } from "@/lib/propertyImages"
import styles from "@/components/property/PropertyUpgrade.module.css"
type Props = { slug: string; src?: string; alt: string; className?: string; district?: string; locality?: string; propertyType?: string; visual?: PropertyVisual }
export default function PropertyImage(props: Props) {
  const { slug, src, alt, className = "", district = "", locality = "", propertyType = "", visual } = props
  const [failed, setFailed] = useState<string[]>([])
  const [loaded, setLoaded] = useState("")
  const media = approvedMedia(slug, src)
  const reviewed = reviewedInventoryMedia(src)
  const visuals = getPropertyVisuals(district, locality, propertyType, [], slug)
  const actual = !visual && (media?.url || (reviewed ? src : undefined))
  const candidates = [actual, visual?.url || visuals.heroImage, visuals.fallback.url].filter((url): url is string => Boolean(url))
  const url = candidates.find(candidate => !failed.includes(candidate))
  const illustrative = !actual || url !== actual
  const caption = illustrative ? "Illustrative imagery · not a project photo" : media?.kind === "render" ? "Approved architectural render" : "Reviewed listing photo"
  return <div className={`${styles.visual} ${className}`} data-loaded={url && loaded === url}>
    {url ? <img key={url} src={responsivePhoto(url, 1000)} srcSet={illustrative ? `${responsivePhoto(url, 480)} 480w, ${responsivePhoto(url, 1000)} 1000w, ${responsivePhoto(url, 1600)} 1600w` : undefined} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 700px" alt={illustrative ? visual?.label || visuals.hero.label : alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onLoad={() => setLoaded(url)} onError={() => setFailed(values => [...values, url])} /> : <div className={styles.visualError}>Image unavailable. Project records remain available below.</div>}
    <span className={styles.visualCaption}>{url ? caption : "Project record"}</span>
  </div>
}
