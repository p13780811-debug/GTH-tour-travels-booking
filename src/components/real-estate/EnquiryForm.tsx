"use client"
import { useId, useState } from "react"
import { readApiJson } from "@/lib/api-response"

export default function EnquiryForm({ propertyId, inventoryId, mode = "listing" }: { propertyId: number; inventoryId?: string; mode?: "listing" | "registry" | "inventory" }) {
 const formId = useId()
 const [phone, setPhone] = useState("")
 const [busy, setBusy] = useState(false)
 const [message, setMessage] = useState("")
 const [failed, setFailed] = useState(false)
 const registry = mode === "registry"
 const inventory = mode === "inventory" && Boolean(inventoryId)

 return <form aria-busy={busy} className="gth-glass rounded-2xl p-4 space-y-3" onSubmit={async event => {
  event.preventDefault(); if (busy) return; setBusy(true); setMessage(""); setFailed(false)
  try {
   await readApiJson(await fetch("/api/real-estate/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propertyId, inventory_id: inventory ? inventoryId : undefined, phone, source: inventory ? "inventory_enquiry" : registry ? "registry_project_interest" : "property_enquiry" }) }))
   setMessage(inventory ? "Availability request received for this inventory item." : registry ? "Request received. GTH PRO will use this interest to source current project information when available." : "Enquiry received. A visit is confirmed only after the listing contact responds.")
   setPhone("")
  } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Enquiry could not be sent.") }
  finally { setBusy(false) }
 }}>
  <label htmlFor={`${formId}-phone`} className="block">Your phone number</label>
  <input id={`${formId}-phone`} aria-describedby={`${formId}-privacy`} disabled={busy} className="gth-glass rounded-xl p-3 w-full" type="tel" inputMode="tel" autoComplete="tel" required minLength={8} maxLength={24} value={phone} onChange={e => setPhone(e.target.value)} />
  <p id={`${formId}-privacy`} className="text-sm opacity-70">{inventory ? "Your number is stored against this specific inventory item for follow-up." : registry ? "Your number is stored with this project-interest request. It is not presented as a direct developer or seller enquiry." : "Your number will be shared with the listing team to respond to this enquiry."}</p>
  <button className={`gth-btn gth-btn-gold inline-flex items-center justify-center gap-2`} disabled={busy}>{busy ? "Sending…" : inventory ? "Request availability" : registry ? "Request project details" : "Send enquiry"}</button>
  {message && <p role={failed ? "alert" : "status"}>{message}</p>}
 </form>
}
