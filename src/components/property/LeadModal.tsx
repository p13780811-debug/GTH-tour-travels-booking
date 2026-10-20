"use client"
import { useId, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, CheckCircle2, Send } from "lucide-react"
import { BUDGET_CHOICES, UNIT_CHOICES, indianPhone, safePropertyDocument, type LeadIntent, type PropertyDocument, type PropertyLeadTarget } from "@/lib/real-estate/buyer-leads"
import PropertyDialog from "./PropertyDialog"
const modes: { value: LeadIntent; label: string }[] = [{ value:"pricing_enquiry",label:"Price breakup" },{ value:"brochure_download",label:"Brochure & plans" },{ value:"site_visit",label:"Site visit" }]
export default function LeadModal({ property, initialIntent, onClose }: { property: PropertyLeadTarget; initialIntent: LeadIntent; onClose: () => void }) {
  const [intent, setIntent] = useState(initialIntent), [busy, setBusy] = useState(false), [error, setError] = useState("")
  const [success, setSuccess] = useState(false), [documents, setDocuments] = useState<PropertyDocument[]>([])
  const requestId = useRef<string>(""), formId = useId()
  return <PropertyDialog title={success ? "Your project enquiry" : "Let’s plan your next step."} onClose={onClose}>
    {success ? <div className={"space-y-3 py-4 text-sm leading-6 [&>svg]:text-[var(--gold)] [&_h3]:text-xl [&_h3]:font-semibold [&_p]:text-[var(--text-muted)] [&_a]:mt-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:underline [&_code]:break-all"} role="status"><CheckCircle2 size={36} /><h3>Request received.</h3><p>Your interest in <strong>{property.title}</strong> is saved for the GTH PRO team. A site visit, current price or document is confirmed only after review.</p>{documents.length > 0 && <div><h4 className="mt-5 font-semibold">Approved project documents</h4>{documents.map(document => <a key={document.url} href={document.url} target="_blank" rel="noopener noreferrer">{document.title}<ArrowUpRight size={15} /></a>)}</div>}{intent === "brochure_download" && documents.length === 0 && <p className="mt-4">No approved project PDF is currently published here. Your request has been recorded for follow-up.</p>}<p className="mt-5">Request reference<br /><code>{requestId.current}</code></p></div> : <>
      <p className={"text-xs leading-6 text-[var(--text-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--text)]"}><strong>{property.title}</strong>{property.rera_id ? ` · ${property.rera_id}` : ""}</p>
      <div className="my-4 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Enquiry type">{modes.map(mode => <button className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs shadow-none ${intent === mode.value ? "border-[var(--gold)] bg-[var(--bg-soft)] font-semibold text-[var(--text)]" : "border-[var(--border)] bg-[var(--card)] font-medium text-[var(--text-muted)]"}`} key={mode.value} type="button" aria-pressed={intent === mode.value} disabled={busy} onClick={() => { setIntent(mode.value); requestId.current = ""; setError("") }}>{mode.label}{intent === mode.value && <Check size={14} aria-hidden="true" />}</button>)}</div>
      <p className={`${"text-xs leading-6 text-[var(--text-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--text)]"} mb-5`}>{intent === "brochure_download" ? "Request the approved brochure and floor plans. Published PDFs become available after submission; missing documents are requested for follow-up." : intent === "site_visit" ? "Share your interest in a visit. The team must confirm project availability and appointment details before you travel." : "Ask for current project information and a price breakup. Registry information alone does not establish available units."}</p>
      <form className={"grid grid-cols-1 gap-3 sm:grid-cols-2 [&_label]:block [&_label]:text-xs [&_label]:font-medium [&_input:not([type=checkbox])]:mt-1 [&_input:not([type=checkbox])]:min-h-11 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-lg [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-[var(--border)] [&_input:not([type=checkbox])]:bg-[var(--bg-soft)] [&_input:not([type=checkbox])]:px-3 [&_input:not([type=checkbox])]:text-base [&_select]:mt-1 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[var(--border)] [&_select]:bg-[var(--bg-soft)] [&_select]:px-3 [&_select]:text-base"} aria-busy={busy} onSubmit={async event => {
        event.preventDefault(); if (busy) return; setError("")
        const form = new FormData(event.currentTarget), phone = indianPhone(form.get("phone"))
        if (!phone) { setError("Enter a valid 10-digit Indian mobile number."); return }
        requestId.current ||= crypto.randomUUID(); setBusy(true)
        try {
          const response = await fetch("/api/property/lead", { method:"POST", headers:{"Content-Type":"application/json"}, signal:AbortSignal.timeout(15000), body:JSON.stringify({ property_id:property.id,full_name:form.get("full_name"),phone,email:form.get("email"),preferred_unit:form.get("preferred_unit"),budget_range:form.get("budget_range"),intent_type:intent,consent_to_contact:form.get("consent")==="yes",website_check:form.get("website_check"),request_id:requestId.current }) })
          const result: { received?: boolean; error?: string; documents?: unknown[] } = await response.json()
          if (!response.ok || result.received !== true) throw new Error(result.error || "The request could not be confirmed. Please retry.")
          setDocuments((Array.isArray(result.documents) ? result.documents : []).flatMap(value => { const document = safePropertyDocument(value); return document ? [document] : [] })); setSuccess(true)
        } catch (cause) { setError(cause instanceof Error && cause.name === "TimeoutError" ? "The confirmation took too long. Retry safely; the same request will not be added twice." : cause instanceof Error ? cause.message : "Unable to send your enquiry.") }
        finally { setBusy(false) }
      }}>
        <label className={"sm:col-span-2"} htmlFor={`${formId}-name`}>Full name<input id={`${formId}-name`} name="full_name" autoComplete="name" required minLength={2} maxLength={150} disabled={busy} /></label>
        <label htmlFor={`${formId}-phone`}>Indian mobile number<input id={`${formId}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={24} placeholder="10-digit mobile number" disabled={busy} /></label>
        <label htmlFor={`${formId}-email`}>Email <span className={"text-xs leading-6 text-[var(--text-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--text)]"}>(optional)</span><input id={`${formId}-email`} name="email" type="email" autoComplete="email" maxLength={150} disabled={busy} /></label>
        <label htmlFor={`${formId}-unit`}>Preferred unit<select id={`${formId}-unit`} name="preferred_unit" defaultValue="2 BHK" disabled={busy}>{UNIT_CHOICES.map(unit => <option key={unit}>{unit}</option>)}</select></label>
        <label htmlFor={`${formId}-budget`}>Budget preference<select id={`${formId}-budget`} name="budget_range" defaultValue="Not decided" disabled={busy}>{BUDGET_CHOICES.map(budget => <option key={budget}>{budget}</option>)}</select></label>
        <label className={"sr-only"} aria-hidden="true">Leave this empty<input name="website_check" tabIndex={-1} autoComplete="off" /></label>
        <label className={`${"flex items-start gap-3 text-xs font-normal leading-6 [&_input]:mt-1 [&_input]:h-4 [&_input]:w-4 [&_input]:shrink-0 [&_input]:accent-[var(--gold)] [&_a]:underline"} ${"sm:col-span-2"}`}><input type="checkbox" name="consent" value="yes" required disabled={busy} /><span>I agree that GTH PRO may contact me about this project enquiry. <Link href="/privacy-policy" target="_blank">Privacy policy</Link></span></label>
        {error && <p className={"rounded-lg border border-[var(--gold)] p-3 text-xs sm:col-span-2"} role="alert">{error}</p>}
        <button className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2 sm:col-span-2" disabled={busy}>{busy ? "Saving your request…" : "Send project enquiry"}<Send size={15} /></button>
        <p className={`${"text-xs leading-6 text-[var(--text-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--text)]"} ${"sm:col-span-2"}`}>Submitting an enquiry does not reserve a unit, schedule a visit or confirm a price.</p>
      </form>
    </>}
  </PropertyDialog>
}
