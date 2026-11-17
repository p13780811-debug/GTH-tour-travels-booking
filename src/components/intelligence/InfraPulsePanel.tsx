"use client";
import Link from "next/link";
import {useState} from "react";
import type {InfraPulse} from "@/lib/intelligence/contracts";
import type {InvestorCurrency} from "@/lib/real-estate/investor-currency";
import IntelligenceLeadForm from "./IntelligenceLeadForm";
export default function InfraPulsePanel({propertyId,pulse,currency="INR",compact=false}:{propertyId:number;pulse?:InfraPulse;currency?:InvestorCurrency;compact?:boolean}){
 const [open,setOpen]=useState(false);
 if(!pulse||pulse.count<1||!pulse.notices.length||pulse.notices.some(n=>Date.parse(n.deadline)<=Date.now()))return null;
 return <section aria-label="Infra-Pulse public tender activity" className="gth-glass my-4 rounded-2xl border border-[var(--gold)] p-4 text-[var(--text)]">
  <p className="gth-badge-gold text-xs font-semibold">🔥 Infra-Pulse · {pulse.count} Active Public Infrastructure Tenders</p>
  <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Shared recorded geography only. Tender activity does not establish a high-growth corridor, proximity, project award, property appreciation or investment return.</p>
  <details open={!compact} className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Regional public works intelligence</summary><ul className="mt-3 space-y-3">{pulse.notices.map(n=><li key={n.id} className="border-b border-[var(--border)] pb-3 text-sm"><Link prefetch={false} href={"/tender/"+n.id} className="font-semibold underline">{n.title}</Link><p className="mt-1 text-xs">{n.authority} · {n.scope==="region"?"Region-level":n.scope==="district"?"District-level":"City-level"}: {n.region}</p><p className="mt-1 text-xs">Bid deadline: <time dateTime={n.deadline}>{new Date(n.deadline).toISOString().slice(0,16).replace("T"," ")} UTC</time></p></li>)}</ul>{pulse.count>pulse.notices.length&&<p className="mt-2 text-xs">Showing {pulse.notices.length} of {pulse.count} matches.</p>}</details>
  <button type="button" className="gth-btn gth-btn-gold mt-3 min-h-11" onClick={()=>setOpen(!open)} aria-expanded={open}>Request Infra-Backed Investor Dossier · WhatsApp follow-up</button>
  {open&&<IntelligenceLeadForm kind="infra" propertyId={propertyId} initialCurrency={currency}/>}
 </section>;
}
