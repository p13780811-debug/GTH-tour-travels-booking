"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowRight, CheckCircle2, Send} from "lucide-react";
const choices=[
  ["developer","Property developer / builder"],["agent","Real-estate agent / broker"],
  ["travel_supplier","Travel supplier / hotel / tour operator"],
  ["affiliate","Affiliate or commercial partnership"],
  ["general","General enquiry"],
] as const;
export default function PartnerApplicationForm({defaultType="developer",realEstateOnly=false}:{defaultType?:string;realEstateOnly?:boolean}){
  const [type,setType]=useState(defaultType);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);
  const input="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]";
  const label="block text-xs font-semibold tracking-wide text-[var(--text-soft)]";
  return <section aria-label="Apply to work with GTH PRO" className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-7">
    {success?<div role="status" className="py-10 text-center">
      <CheckCircle2 className="mx-auto text-[var(--gold)]" size={36}/>
      <h2 className="mt-4 text-2xl font-semibold">Application received</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
        Your enquiry was saved for review. This is not a partnership approval or a published listing.
      </p>
      <Link href="/partners" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">View partnership information <ArrowRight size={16}/></Link>
    </div>:<>
      <h2 className="text-2xl font-semibold">Introduce your business</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Tell us what you offer. Never send ID scans, bank account numbers, API secrets or passwords here.</p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={async e=>{
        e.preventDefault();if(busy)return;setError("");setBusy(true);
        try{
          const raw=Object.fromEntries(new FormData(e.currentTarget));
          const payload={
            ...raw,application_type:type,
            consent_to_contact:raw.consent_to_contact==="yes",
          };
          const response=await fetch("/api/partners/apply",{
            method:"POST",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
          });
          const data=await response.json();
          if(!response.ok)throw new Error(data.error||"Application unavailable");
          setSuccess(true);
        }catch(err){setError(err instanceof Error?err.message:"Unable to send enquiry.");}
        finally{setBusy(false);}
      }}>
        <label className={label+" sm:col-span-2"}>What describes your enquiry?
          <select name="application_type" value={type} onChange={e=>setType(e.target.value)} className={input}>
            {choices.filter(([value])=>!realEstateOnly||value==="developer"||value==="agent").map(([value,title])=><option key={value} value={value}>{title}</option>)}
          </select>
        </label>
        <label className={label}>Contact name *
          <input className={input} name="contact_name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name"/></label>
        <label className={label}>Business email *
          <input className={input} name="contact_email" type="email" required maxLength={254} autoComplete="email" placeholder="you@company.com"/></label>
        <label className={label}>Organisation
          <input className={input} name="organisation" maxLength={160} placeholder="Company or agency"/></label>
        <label className={label}>Country
          <input className={input} name="country" maxLength={100} placeholder="India, UAE, UK..."/></label>
        <label className={label}>Business website (HTTPS)
          <input className={input} name="website" type="url" maxLength={500} placeholder="https://example.com"/></label>
        <label className={label}>Project or portfolio URL (HTTPS)
          <input className={input} name="project_url" type="url" maxLength={500} placeholder="https://example.com/projects"/></label>
        <label className={label+" sm:col-span-2"}>Tell us about your projects or partnership interest *
          <textarea name="message" required minLength={15} maxLength={3000} rows={6} className={input} placeholder="Describe your real inventory, service coverage, distribution programme or business needs..."/></label>
        <input className="sr-only" name="website_check" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-soft)] sm:col-span-2">
          <input className="mt-1 h-4 w-4 accent-amber-600" name="consent_to_contact" type="checkbox" value="yes" required/>
          I agree to be contacted about this enquiry, and I confirm I have permission to share the supplied business information. See our <Link href="/privacy-policy" className="font-semibold text-[var(--gold)] underline">Privacy Policy</Link>.
        </label>
        {error&&<p role="alert" className="rounded-xl border border-[var(--border)] p-3 text-sm sm:col-span-2">{error}</p>}
        <button className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold disabled:opacity-50 sm:col-span-2" disabled={busy} type="submit">
          <Send size={16}/>{busy?"Sending for review...":"Send application for review"}
        </button>
      </form>
    </>}
  </section>;
}
