"use client"
import { useState } from "react"
import { ArrowUpRight, Handshake } from "lucide-react"
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm"
import PropertyDialog from "./PropertyDialog"
export default function PartnerHandshake({ footer = false, onOpen }: { footer?: boolean; onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  return <><section className={`${"mt-5 w-full border-t border-[var(--border)] pt-4 [&_button]:flex [&_button]:min-h-11 [&_button]:w-full [&_button]:items-center [&_button]:justify-between [&_button]:gap-2 [&_button]:text-left [&_button]:text-xs [&_p]:mt-1 [&_p]:text-xs [&_p]:text-[var(--text-muted)]"} ${footer ? "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 [&_button]:text-sm" : ""}`}><button type="button" onClick={() => { onOpen?.(); setOpen(true) }}><Handshake size={18} /><span>RERA channel partner or builder?</span><ArrowUpRight size={16} /></button><p>Introduce your business for review and project enquiries.</p></section>{open && <PropertyDialog title="Work with GTH PRO Real Estate" onClose={() => setOpen(false)}><p className={`${"text-xs leading-6 text-[var(--text-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--text)]"} mb-4`}>Share your public RERA registration reference in the message. Registration and project authority are reviewed before any partnership or lead handoff.</p><div className={"[&_h2]:text-xl [&_p]:text-sm [&_input]:text-base [&_select]:text-base [&_textarea]:text-base"}><PartnerApplicationForm defaultType="developer" realEstateOnly /></div></PropertyDialog>}</>
}
