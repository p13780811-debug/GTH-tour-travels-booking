"use client"
import { useState } from "react"
import { ArrowUpRight, CalendarDays, FileText, MessageSquare } from "lucide-react"
import type { LeadIntent, PropertyLeadTarget } from "@/lib/real-estate/buyer-leads"
import LeadModal from "./LeadModal"
export default function PropertyLeadActions({ property, compact = false }: { property: PropertyLeadTarget; compact?: boolean }) {
  const [intent, setIntent] = useState<LeadIntent | null>(null)
  return <><div className={`${"my-4 flex flex-wrap gap-2 [&_button]:inline-flex [&_button]:min-h-11 [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:border [&_button]:border-[var(--border)] [&_button]:bg-[var(--bg-soft)] [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs [&_button]:text-[var(--text)] [&_button:first-child]:border-[var(--gold)]"} ${compact ? "mt-2 [&_button]:w-full" : ""}`}>
    <button type="button" aria-label={compact ? `Request details for ${property.title}` : undefined} onClick={() => setIntent("pricing_enquiry")}><MessageSquare size={14} />{compact ? "Price & project enquiry" : "Request price breakup"}{compact && <ArrowUpRight size={13} />}</button>
    {!compact && <><button type="button" onClick={() => setIntent("brochure_download")}><FileText size={14} />Brochure & floor plans</button><button type="button" onClick={() => setIntent("site_visit")}><CalendarDays size={14} />Request a site visit</button></>}
  </div>{intent && <LeadModal property={property} initialIntent={intent} onClose={() => setIntent(null)} />}</>
}
