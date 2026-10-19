"use client"
import { useCallback, useState } from "react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import { getPropertyVisuals, responsivePhoto, type PropertyVisual } from "@/lib/propertyImages"
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
  const imageRef = useCallback((node: HTMLImageElement | null) => { if (node?.complete && node.naturalWidth > 0) setLoaded(url || "") }, [url])
  const illustrative = !actual || url !== actual
  const caption = illustrative ? "Illustrative imagery · not a project photo" : media?.kind === "render" ? "Approved architectural render" : "Reviewed listing photo"
  return <div className={`${"relative isolate min-w-0 overflow-hidden bg-[var(--bg-soft)]"} ${className}`}>
    {url ? <img ref={imageRef} key={url} className={`block h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${loaded === url ? "opacity-100" : "opacity-0"}`} src={responsivePhoto(url, 1000)} srcSet={illustrative ? `${responsivePhoto(url, 480)} 480w, ${responsivePhoto(url, 1000)} 1000w, ${responsivePhoto(url, 1600)} 1600w` : undefined} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 700px" alt={illustrative ? visual?.label || visuals.hero.label : alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onLoad={() => setLoaded(url)} onError={() => setFailed(values => [...values, url])} /> : <div className={"flex h-full min-h-40 items-center justify-center p-5 text-center text-xs text-[var(--text-muted)]"}>Image unavailable. Project records remain available below.</div>}
    <span className={"absolute bottom-2 left-2 right-2 z-10 w-fit max-w-[calc(100%-16px)] rounded bg-[var(--card)]/90 px-2 py-1 text-[10px] leading-4 text-[var(--text)]"}>{url ? caption : "Project record"}</span>
  </div>
}
