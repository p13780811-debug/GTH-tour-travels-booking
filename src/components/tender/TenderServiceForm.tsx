"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {CheckCircle2,Send} from "lucide-react";
import {TENDER_SERVICES,validateServiceRequest,type TenderServiceId} from "@/lib/tender/services";
export default function TenderServiceForm({initialService,tender}:{initialService:TenderServiceId;tender:{id:string;title:string}|null}){
  const [service,setService]=useState(initialService),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [reference,setReference]=useState("");
  const attempt=useRef<{body:string;id:string}|null>(null);
  const selected=TENDER_SERVICES.find(item=>item.id===service)!;
  if(reference)return <section role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
    <CheckCircle2 size={30} aria-hidden="true" className="text-[var(--gold)]"/>
    <h2 className="mt-4 text-xl font-semibold">Service request received</h2>
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Your request was saved for review. We will use your contact details to discuss availability, scope and a written fee quote. Work begins only after you accept the agreed terms.</p>
    <p className="mt-4 text-xs text-[var(--text-soft)]">Request reference</p>
    <p className="mt-2 break-all font-mono text-sm">{reference}</p>
    <Link href="/tender" className="gth-btn gth-btn-gold mt-6 inline-flex items-center justify-center">Back to tender discovery</Link>
  </section>;
  return <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7" aria-labelledby="service-form-title">
    <h2 id="service-form-title" className="text-xl font-semibold">Request a service quote</h2>
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Share your business needs. Fees, delivery time and service availability are confirmed after review.</p>
    {tender&&<div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm">
      <p className="text-xs text-[var(--text-soft)]">Selected tender</p><p className="mt-2 break-words font-semibold">{tender.title}</p>
      <Link className="mt-2 inline-flex min-h-10 items-center text-[var(--gold)] underline" href={`/tender/${tender.id}`}>View notice</Link>
    </div>}
    <form className="mt-6" onSubmit={async event=>{
      event.preventDefault();if(busy)return;setError("");
      const fields=Object.fromEntries(new FormData(event.currentTarget));
      const body={...fields,service,tender_id:tender?.id??null,consent_to_contact:fields.consent_to_contact==="yes"};
      const fingerprint=JSON.stringify(body);
      if(!attempt.current||attempt.current.body!==fingerprint)attempt.current={body:fingerprint,id:crypto.randomUUID()};
      const parsed=validateServiceRequest({...body,request_id:attempt.current.id});
      if(!parsed.ok){setError(parsed.error);return;}
      setBusy(true);
      try{
        const response=await fetch("/api/tender/services",{method:"POST",headers:{"Content-Type":"application/json"},
          signal:AbortSignal.timeout(20000),body:JSON.stringify({...parsed.value,consent_to_contact:true,website_check:fields.website_check})});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||"Request unavailable. Please retry later.");
        if(result.received!==true||result.reference!==attempt.current.id)throw new Error("Request confirmation unavailable. Retry with the same form.");
        setReference(result.reference);
      }catch(failure){setError(failure instanceof Error&&failure.name!=="TimeoutError"?failure.message:"Connection timed out. Your details are still here; retry with the same form.");}
      finally{setBusy(false);}
    }}>
      <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="sr-only">Your service request</legend>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Service
          <select name="service" className="gth-input mt-2 w-full min-w-0" value={service} onChange={event=>setService(event.target.value as TenderServiceId)}>
            {TENDER_SERVICES.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <p className="text-sm leading-7 text-[var(--text-soft)] sm:col-span-2">{selected.deliverable}</p>
        <label className="min-w-0 text-sm font-semibold">Full name *<input name="contact_name" autoComplete="name" required minLength={2} maxLength={100} className="gth-input mt-2 w-full min-w-0"/></label>
        <label className="min-w-0 text-sm font-semibold">Business email *<input name="contact_email" type="email" autoComplete="email" required maxLength={254} className="gth-input mt-2 w-full min-w-0"/></label>
        <label className="min-w-0 text-sm font-semibold">Company / business name *<input name="organisation" autoComplete="organization" required minLength={2} maxLength={160} className="gth-input mt-2 w-full min-w-0"/></label>
        <label className="min-w-0 text-sm font-semibold">Phone with country code *<input name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+91 98765 43210" aria-describedby="service-phone-help" className="gth-input mt-2 w-full min-w-0"/><span id="service-phone-help" className="mt-2 block text-xs font-normal text-[var(--text-soft)]">8–15 digits, including your country code.</span></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Country / service market *<input name="country" autoComplete="country-name" required minLength={2} maxLength={100} className="gth-input mt-2 w-full min-w-0"/></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">What help do you need? *<textarea name="notes" required minLength={20} maxLength={900} rows={5} aria-describedby="service-notes-help" className="gth-input mt-2 w-full min-w-0"/><span id="service-notes-help" className="mt-2 block text-xs font-normal leading-6 text-[var(--text-soft)]">Include your sector, intended timeline and questions. Keep passwords, OTPs, banking details and confidential bid prices out of this form.</span></label>
        <input name="website_check" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <label className="flex items-start gap-3 text-sm leading-7 text-[var(--text-soft)] sm:col-span-2"><input name="consent_to_contact" value="yes" type="checkbox" required className="mt-2 shrink-0"/> <span>I agree to be contacted about this service request and have permission to share these business details. <Link href="/privacy-policy" className="text-[var(--gold)] underline">Privacy Policy</Link></span></label>
        {error&&<p role="alert" className="rounded-xl border border-[var(--border)] p-4 text-sm leading-7 sm:col-span-2">{error}</p>}
        <button type="submit" className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2 sm:col-span-2"><Send size={16} aria-hidden="true"/>{busy?"Saving your request…":"Request written quote"}</button>
      </fieldset>
    </form>
  </section>;
}
