"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicTender } from "@/lib/tender/catalog";
import { downloadTenderFile } from "./TenderDiscoveryActions";

type Locale = "en" | "hi" | "mr" | "bn";
type Profile = { company: string; tax: string; contact: string; amount: string; timeline: string };
const initial: Profile = { company: "", tax: "", contact: "", amount: "", timeline: "" };
const translations: Record<Locale, { company:string; tax:string; contact:string; amount:string; timeline:string; generate:string }> = {
  en:{company:"Company name",tax:"GST / Tax ID",contact:"Contact",amount:"Quoted amount",timeline:"Delivery timeline",generate:"Generate bid draft"},
  hi:{company:"कंपनी का नाम",tax:"जीएसटी / कर आईडी",contact:"संपर्क",amount:"प्रस्तावित राशि",timeline:"डिलीवरी अवधि",generate:"बोली का मसौदा बनाएं"},
  mr:{company:"कंपनीचे नाव",tax:"जीएसटी / कर आयडी",contact:"संपर्क",amount:"प्रस्तावित रक्कम",timeline:"कामाची मुदत",generate:"निविदा मसुदा तयार करा"},
  bn:{company:"কোম্পানির নাম",tax:"জিএসটি / কর আইডি",contact:"যোগাযোগ",amount:"প্রস্তাবিত মূল্য",timeline:"কাজের সময়সীমা",generate:"দরপত্রের খসড়া তৈরি করুন"}
};
function clean(value: string, max = 120) {
  return value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g,'""') + '"';
}
function safeFilename(id:string) { return clean(id,70).replace(/[^a-zA-Z0-9_-]/g,"-") || "tender"; }
function makeDraft(tender:PublicTender, profile:Profile) {
  const reference=clean(tender.source_reference||tender.id);
  const title=clean(tender.title,240);
  const buyer=clean(tender.buyer,160);
  const region=clean(tender.region||tender.country_code);
  const deadline=Number.isFinite(Date.parse(tender.deadline_at))?new Date(tender.deadline_at).toISOString().slice(0,10):"Verify official notice";
  const currency=/^[A-Z]{3}$/.test(tender.currency||"")?tender.currency:"Currency to confirm";
  const lines=[
    "DRAFT BID PACKAGE — NOT A SUBMITTED BID",
    "Tender reference: "+reference, "Title: "+title, "Authority: "+buyer,
    "Location: "+region, "Deadline (UTC): "+deadline,
    "Estimated value: "+(tender.estimated_value==null?"Not published":currency+" "+tender.estimated_value),
    "",
    "COVER LETTER",
    "To: "+buyer,
    "Subject: Draft proposal for "+title+" ("+reference+")",
    "Dear Procurement Officer,",
    "On behalf of "+profile.company+", we express our interest in the above tender and submit this preliminary quotation for consideration, subject to review of the complete official tender documents.",
    "Our quoted amount is "+currency+" "+profile.amount+" and proposed delivery timeline is "+profile.timeline+".",
    "Company: "+profile.company+" | GST/Tax ID: "+profile.tax+" | Contact: "+profile.contact,
    "Sincerely, "+profile.company,
    "",
    "COMPLIANCE CHECKLIST (UNVERIFIED — REVIEW ORIGINAL NOTICE)",
    "[ ] Verify tender eligibility, addenda and submission portal",
    "[ ] Verify registration, tax and statutory documents",
    "[ ] Verify technical specifications, quantities and delivery milestones",
    "[ ] Verify EMD, fees, securities and financial requirements",
    "[ ] Verify applicable taxes, bid validity and deadline",
    "[ ] Obtain authorized signature and submit through official channel",
    "",
    "FINANCIAL QUOTATION SUMMARY",
    "Description | Quantity | Unit | Amount",
    "Provisional lump-sum quotation | 1 | lot | "+currency+" "+profile.amount,
    "Taxes, itemized BOQ and commercial terms require confirmation from official documents.",
    "This draft does not establish compliance or constitute a formal bid."
  ];
  return {text:lines.join("\n"),currency,reference,title};
}
export default function TenderBidGenerator({tender}:{tender:PublicTender}) {
  const [open,setOpen]=useState(false);
  const [locale,setLocale]=useState<Locale>("en");
  const [profile,setProfile]=useState<Profile>(initial);
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  const dialog=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    function onKey(event:KeyboardEvent) {
      if(event.key==="Escape")setOpen(false);
      if(event.key==="Tab"&&dialog.current){
        const elements=Array.from(dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled])"));
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }
    document.addEventListener("keydown",onKey);
    return ()=>{document.removeEventListener("keydown",onKey);(previous||trigger.current)?.focus();};
  },[open]);
  const amount=Number(profile.amount);
  const valid=profile.company.length>=2&&profile.contact.length>=3&&profile.timeline.length>=2&&
    profile.tax.length>=3&&/^[0-9]+(?:\.[0-9]{1,2})?$/.test(profile.amount)&&Number.isFinite(amount)&&amount>0&&amount<=1e15;
  const draft=valid?makeDraft(tender,profile):null;
  const labels=translations[locale];
  function change(key:keyof Profile,value:string){
    setProfile(prev=>({...prev,[key]:key==="amount"?value.replace(/[^0-9.]/g,"").slice(0,19):clean(value,key==="contact"?180:120)}));
    setReady(false);setMessage("");
  }
  async function copy() {
    if(!draft||!ready)return;
    try {await navigator.clipboard.writeText(draft.text);setMessage("Draft copied.");}
    catch {setMessage("Clipboard unavailable; use TXT export.");}
  }
  function exportFile(format:"txt"|"csv") {
    if(!draft||!ready)return;
    const name="gth-bid-"+safeFilename(tender.id)+"."+format;
    const csv=[
      ["Tender reference",draft.reference],["Tender title",draft.title],
      ["Company",profile.company],["GST/Tax ID",profile.tax],["Contact",profile.contact],
      ["Description","Quantity","Unit","Currency","Quoted amount","Delivery timeline"],
      ["Provisional lump-sum quotation","1","lot",draft.currency,profile.amount,profile.timeline]
    ].map(row=>row.map(value=>csvCell(value??"")).join(",")).join("\r\n");
    downloadTenderFile(format==="csv"?"\uFEFF"+csv:draft.text,name,format==="csv"?"text/csv;charset=utf-8":"text/plain;charset=utf-8");
    setMessage(format.toUpperCase()+" downloaded.");
  }
  return <>
    <button ref={trigger} type="button" className="gth-btn gth-btn-gold inline-flex min-h-11 items-center justify-center" onClick={()=>{setOpen(true);setMessage("");}}>Generate Bid Draft &amp; BOQ</button>
    {open&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={"bid-title-"+tender.id} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-3"><div><h2 id={"bid-title-"+tender.id} className="text-xl font-semibold">Generate Bid Draft &amp; BOQ</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Free, on-device draft. No AI API, account, or database write. Verify official documents before bidding.</p></div><button type="button" className="gth-btn" onClick={()=>setOpen(false)} aria-label="Close dialog">Close</button></div>
        <p className="mt-4 break-words text-sm font-semibold">{clean(tender.title,240)}</p>
        <label className="mt-4 block text-sm">Input labels <select className="ml-2 rounded border border-[var(--border)] bg-[var(--bg)] p-2" value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option><option value="bn">Bangla</option></select></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{(["company","tax","contact","amount","timeline"] as const).map(key=><label key={key} className="text-sm font-medium">{labels[key]}<input className="mt-1 block min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]" required maxLength={key==="amount"?19:120} inputMode={key==="amount"?"decimal":"text"} value={profile[key]} onChange={e=>change(key,e.target.value)} autoComplete="off"/></label>)}</div>
        <button type="button" disabled={!valid} className="gth-btn gth-btn-gold mt-5 disabled:opacity-50" onClick={()=>{setReady(true);setMessage("Draft ready for review.");}}>{labels.generate}</button>
        {!valid&&<p className="mt-2 text-xs text-[var(--text-soft)]">Complete all fields and enter a positive quoted amount (up to two decimal places).</p>}
        {ready&&draft&&<><pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-xs leading-6">{draft.text}</pre><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="gth-btn" onClick={copy}>Copy</button><button type="button" className="gth-btn" onClick={()=>window.print()}>Print / Save PDF</button><button type="button" className="gth-btn" onClick={()=>exportFile("csv")}>Export BOQ CSV</button><button type="button" className="gth-btn" onClick={()=>exportFile("txt")}>Export TXT</button></div></>}
        <p role="status" className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
      </div>
    </div>}
  </>;
}
