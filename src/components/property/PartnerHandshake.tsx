"use client"
import { useState } from "react"
import { ArrowUpRight, Handshake } from "lucide-react"
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm"
import PropertyDialog from "./PropertyDialog"
import styles from "./PropertyUpgrade.module.css"
export default function PartnerHandshake({ footer = false, onOpen }: { footer?: boolean; onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  return <><section className={`${styles.partner} ${footer ? styles.partnerFooter : ""}`}><button type="button" onClick={() => { onOpen?.(); setOpen(true) }}><Handshake size={18} /><span>RERA channel partner or builder?</span><ArrowUpRight size={16} /></button><p>Introduce your business for review and project enquiries.</p></section>{open && <PropertyDialog title="Work with GTH PRO Real Estate" onClose={() => setOpen(false)}><p className={`${styles.note} mb-4`}>Share your public RERA registration reference in the message. Registration and project authority are reviewed before any partnership or lead handoff.</p><div className={styles.partnerForm}><PartnerApplicationForm defaultType="developer" realEstateOnly /></div></PropertyDialog>}</>
}
