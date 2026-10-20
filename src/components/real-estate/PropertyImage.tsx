"use client"
import { useState } from "react"
import { Building2 } from "lucide-react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"

type Props = {
  slug: string; src?: string; alt: string; className?: string;
  district?: string; locality?: string; propertyType?: string; reraId?: string;
}

/**
 * Only show exact approved/reviewed project media. A unique, source-backed record
 * cover replaces the old four-photo stock rotation when project media is absent.
 */
export default function PropertyImage({ slug, src, alt, className = "", district = "", locality = "", propertyType = "", reraId }: Props) {
  const [failed, setFailed] = useState<string[]>([])
  const approved = approvedMedia(slug, src)
  const url = approved?.url || (reviewedInventoryMedia(src) ? src : undefined)
  const visible = Boolean(url && !failed.includes(url))
  return <div className={`relative isolate min-w-0 overflow-hidden bg-[var(--bg-soft)] ${className}`}>
    {visible && url ? <>
      <img key={url} src={url} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer"
        className="block h-full w-full object-cover" onError={() => setFailed(previous => [...previous, url])} />
      <span className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-16px)] rounded bg-[var(--card)] px-2 py-1 text-[10px] leading-4 text-[var(--text)]">
        {approved?.kind === "render" ? "Approved architectural render" : "Reviewed project photo"}
      </span>
    </> : <div role="img" aria-label={`Project record for ${alt}. An approved project photograph is not available.`}
      className="flex h-full min-h-40 w-full flex-col justify-end gap-2 border-b border-[var(--border)] bg-[var(--bg-soft)] p-4 pt-14 text-[var(--text)]">
      <strong className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">{alt}</strong>
      <span className="line-clamp-1 text-[11px] text-[var(--text-muted)]">{reraId ? `RERA ${reraId}` : locality || district || propertyType || "Property record"}</span>
      <span className="inline-flex items-center gap-2 text-[10px] font-medium text-[var(--text-muted)]"><Building2 size={14} aria-hidden="true" />Project photo not available</span>
    </div>}
  </div>
}
