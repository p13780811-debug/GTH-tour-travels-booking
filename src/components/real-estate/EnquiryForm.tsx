"use client"
import { useId, useState } from "react"
import { readApiJson } from "@/lib/api-response"
import styles from "./Listing.module.css"
export default function EnquiryForm({ propertyId }: { propertyId: number }) {
 const formId = useId()
 const [phone, setPhone] = useState("")
 const [busy, setBusy] = useState(false)
 const [message, setMessage] = useState("")
 const [failed, setFailed] = useState(false)
 return <form aria-busy={busy} className="gth-glass rounded-2xl p-4 space-y-3" onSubmit={async event => {
  event.preventDefault(); if (busy) return; setBusy(true); setMessage(""); setFailed(false);
  try {
   await readApiJson(await fetch("/api/real-estate/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: propertyId, phone }) }));
   setMessage("Enquiry received. A visit is confirmed only after the listing contact responds."); setPhone("");
  } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Enquiry could not be sent.") }
  finally { setBusy(false) }
 }}>
  <label htmlFor={`${formId}-phone`} className="block">Your phone number</label>
  <input id={`${formId}-phone`} aria-describedby={`${formId}-privacy`} disabled={busy} className="gth-glass rounded-xl p-3 w-full" type="tel" inputMode="tel" autoComplete="tel" required minLength={8} maxLength={24} value={phone} onChange={e => setPhone(e.target.value)} />
  <p id={`${formId}-privacy`} className="text-sm opacity-70">Your number will be shared with the listing team to respond to this enquiry.</p>
  <button className={`gth-btn-gold ${styles.action}`} disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button>
  {message && <p role={failed ? "alert" : "status"}>{message}</p>}
 </form>
}
