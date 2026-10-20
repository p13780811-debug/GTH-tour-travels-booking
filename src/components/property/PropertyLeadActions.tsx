"use client"
import { useState } from "react"
import { ArrowUpRight, CalendarDays, FileText, MessageSquare } from "lucide-react"
import type { LeadIntent, PropertyLeadTarget } from "@/lib/real-estate/buyer-leads"
import LeadModal from "./LeadModal"

export default function PropertyLeadActions({ property, compact = false }: { property: PropertyLeadTarget; compact?: boolean }) {
  const [intent, setIntent] = useState<LeadIntent | null>(null)
  const button = "inline-flex items-center justify-center gap-2"
  return <>
    <div className={`my-4 flex flex-wrap gap-2 ${compact ? "mt-2" : ""}`}>
      <button type="button" className={`gth-btn gth-btn-gold ${button} ${compact ? "w-full" : ""}`}
        aria-label={compact ? `Request details for ${property.title}` : undefined}
        onClick={() => setIntent("pricing_enquiry")}>
        <MessageSquare size={14} />{compact ? "Price & project enquiry" : "Request price breakup"}
        {compact && <ArrowUpRight size={13} />}
      </button>
      {!compact && <>
        <button type="button" className={`gth-btn ${button}`} onClick={() => setIntent("brochure_download")}><FileText size={14} />Brochure & floor plans</button>
        <button type="button" className={`gth-btn ${button}`} onClick={() => setIntent("site_visit")}><CalendarDays size={14} />Request a site visit</button>
      </>}
    </div>
    {intent && <LeadModal property={property} initialIntent={intent} onClose={() => setIntent(null)} />}
  </>
}
