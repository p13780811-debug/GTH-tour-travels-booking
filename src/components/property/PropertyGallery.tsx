"use client"
import { useState } from "react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import { getPropertyVisuals } from "@/lib/propertyImages"
import PropertyImage from "@/components/real-estate/PropertyImage"
type Props = { slug: string; title: string; image?: string; gallery?: string[]; district?: string; locality?: string; propertyType?: string }
export default function PropertyGallery(props: Props) {
  const [selected, setSelected] = useState(0)
  const approved = [...new Set([props.image, ...(props.gallery || [])].filter((url): url is string => typeof url === "string" && Boolean(approvedMedia(props.slug, url) || reviewedInventoryMedia(url))))]
  const visuals = getPropertyVisuals(props.district || "", props.locality || "", props.propertyType || "", [], props.slug)
  const count = approved.length || visuals.gallery.length
  const index = Math.min(selected, count - 1)
  const visual = approved.length ? undefined : visuals.gallery[index]
  return <section aria-label="Property gallery" className="gth-glass rounded-3xl overflow-hidden">
    <PropertyImage key={approved[index] || visual?.url} {...props} src={approved[index]} visual={visual} alt={props.title} className={"h-[280px] w-full md:h-[440px]"} />
    {count > 1 && <div className={"flex gap-2 overflow-x-auto p-3 [&_button]:h-20 [&_button]:w-28 [&_button]:shrink-0 [&_button]:overflow-hidden [&_button]:rounded-lg [&_button]:border [&_button]:border-[var(--border)] [&_button]:bg-[var(--card)] [&_button[aria-pressed=true]]:border-2 [&_button[aria-pressed=true]]:border-[var(--gold)]"}>{Array.from({ length: count }, (_, i) => <button key={i} aria-label={approved.length ? `View listing image ${i + 1}` : `View ${visuals.gallery[i].label}`} aria-pressed={i === index} onClick={() => setSelected(i)}><PropertyImage {...props} src={approved[i]} visual={approved.length ? undefined : visuals.gallery[i]} alt={`Listing image ${i + 1}`} className="h-full w-full" /></button>)}</div>}
    <p className={"px-4 py-3 text-xs leading-6 text-[var(--text-muted)] [&_a]:underline"}>{approved.length ? "Reviewed listing media. Architectural renders are labelled separately." : <>These stock photographs show design inspiration, not this project's exterior, interior, location or floor plan. <a href={visual?.sourceUrl} target="_blank" rel="noopener noreferrer">Photo credit · Pexels</a>. Project documents are provided only when approved and available.</>}</p>
  </section>
}
