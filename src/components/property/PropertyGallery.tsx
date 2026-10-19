"use client"
import { useState } from "react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import PropertyImage from "@/components/real-estate/PropertyImage"

type Props = {
  slug: string; title: string; image?: string; gallery?: string[];
  district?: string; locality?: string; propertyType?: string; reraId?: string;
}

export default function PropertyGallery(props: Props) {
  const [selected, setSelected] = useState(0)
  const approved = [...new Set([props.image, ...(props.gallery || [])]
    .filter((url): url is string => typeof url === "string" && Boolean(approvedMedia(props.slug, url) || reviewedInventoryMedia(url))))]
  const index = Math.min(selected, Math.max(0, approved.length - 1))
  return <section aria-label="Property gallery" className="gth-glass overflow-hidden rounded-3xl">
    <PropertyImage key={approved[index] || props.slug} slug={props.slug} src={approved[index]} alt={props.title}
      district={props.district} locality={props.locality} propertyType={props.propertyType} reraId={props.reraId}
      className="h-[280px] w-full md:h-[440px]" />
    {approved.length > 1 && <div className="flex gap-2 overflow-x-auto p-3">
      {approved.map((url, i) => <button key={url} type="button" aria-label={`View project image ${i + 1}`}
        aria-pressed={i === index} onClick={() => setSelected(i)}
        className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-[var(--card)] ${i === index ? "border-[var(--gold)]" : "border-[var(--border)]"}`}>
        <PropertyImage slug={props.slug} src={url} alt={`${props.title}, photo ${i + 1}`} className="h-full w-full" />
      </button>)}
    </div>}
    <p className="px-4 py-3 text-xs leading-6 text-[var(--text-muted)]">
      {approved.length
        ? "Reviewed listing media is shown when available; architectural renders are identified."
        : "No approved project-specific photographs are published for this record. Please review its official source and request confirmed project media."}
    </p>
  </section>
}
