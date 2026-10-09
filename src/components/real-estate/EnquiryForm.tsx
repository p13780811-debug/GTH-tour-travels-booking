"use client"
import { useState } from "react"
import { readApiJson } from "@/lib/api-response"
export default function EnquiryForm({ propertyId }: { propertyId: number }) {
 const [phone, setPhone] = useState("")
 const [busy, setBusy] = useState(false)
 const [message, setMessage] = useState("")
 return <form className="gth-glass rounded-2xl p-4 space-y-3" onSubmit={async event => {
  event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
  try {
   await readApiJson(await fetch("/api/real-estate/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propertyId, phone }) }));
   setMessage("Enquiry received. A visit is confirmed only after the listing contact responds."); setPhone("");
  } catch (error) { setMessage(error instanceof Error ? error.message : "Enquiry could not be sent.") }
  finally { setBusy(false) }
 }}>
  <label htmlFor={`enquiry-${propertyId}`} className="block">Your phone number</label>
  <input id={`enquiry-${propertyId}`} className="gth-glass rounded-xl p-3 w-full" type="tel" autoComplete="tel" required minLength={8} maxLength={24} value={phone} onChange={e => setPhone(e.target.value)} />
  <p className="text-sm text-[var(--muted)]">Your number will be shared with the listing team to respond to this enquiry.</p>
  <button className="gth-btn-gold" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button>
  {message && <p role="status">{message}</p>}
 </form>
}
