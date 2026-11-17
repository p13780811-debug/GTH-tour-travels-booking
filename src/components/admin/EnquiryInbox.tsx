"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {ENQUIRY_STATUSES,type EnquiryStatus} from "@/lib/intelligence/enquiry-operations";
type Enquiry={id:number;request_id:string;target_key:string;full_name:string;email:string;phone_e164:string|null;contact_preference:string;requested_city:string|null;currency:string;services:string[];notes:string;status:EnquiryStatus;operator_notes:string;next_follow_up_at:string|null;created_at:string;updated_at:string};
type Job={sector:string;last_status:string;last_success_at:string|null;saved:number;scanned:number};
async function api(path:string,body?:Record<string,unknown>){
 const {data}=await supabase.auth.getSession();if(!data.session)throw new Error("Sign in through Operations with an administrator account.");
 const r=await fetch(path,{method:body?"PATCH":"GET",headers:{Authorization:"Bearer "+data.session.access_token,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",signal:AbortSignal.timeout(12000)});
 const result=await r.json();if(!r.ok)throw new Error(result.error||"Private inbox unavailable");return result;
}
function localInput(value:string|null){if(!value)return "";const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function Card({row,onSave}:{row:Enquiry;onSave:(row:Enquiry)=>void}){
 const [status,setStatus]=useState(row.status),[notes,setNotes]=useState(row.operator_notes),[next,setNext]=useState(localInput(row.next_follow_up_at)),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const due=row.status!=="closed"&&row.next_follow_up_at&&Date.parse(row.next_follow_up_at)<=Date.now();
 const draft="Hello "+row.full_name+", regarding your GTH enquiry "+row.request_id+" ("+row.target_key+"). Please confirm your requirements and preferred dates. Property offers, tender eligibility and supplier availability need separate verification. This is a follow-up draft, not a quotation.";
 return <article className="gth-glass rounded-2xl border border-[var(--border)] p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{row.full_name}</h2><span className="gth-badge-gold text-xs">{due?"Follow-up due":row.status.replaceAll("_"," ")}</span></div>
 <p className="mt-2 break-all text-xs text-[var(--text-soft)]">{row.request_id} · {row.target_key} · {row.requested_city||"City not supplied"}</p>
 <p className="mt-2 text-sm">Preferred contact: {row.contact_preference} · <a className="underline" href={"mailto:"+encodeURIComponent(row.email)}>{row.email}</a>{row.phone_e164&&<> · {row.phone_e164}</>}</p>
 <p className="mt-2 text-sm">{row.services.join(", ").replaceAll("_"," ")} · {row.currency}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.notes||"No additional details supplied."}</p>
 <p className="mt-2 text-xs text-[var(--text-soft)]">Received {new Date(row.created_at).toLocaleString()}. Requirements are self-declared, not verified supplier offers.</p>
 <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage("");try{const result=await api("/api/admin/intelligence-leads",{id:row.id,status,operator_notes:notes,next_follow_up_at:next?new Date(next).toISOString():null,expected_updated_at:row.updated_at});onSave(result.item);}catch(error){setMessage(error instanceof Error?error.message:"Update unavailable");}finally{setBusy(false);}}}>
 <label className="text-sm">Review status<select className="gth-input mt-1 min-h-11 w-full" value={status} onChange={e=>setStatus(e.target.value as EnquiryStatus)} disabled={busy}>{ENQUIRY_STATUSES.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
 <label className="text-sm">Next follow-up (your local time)<input className="gth-input mt-1 min-h-11 w-full" type="datetime-local" value={next} onChange={e=>setNext(e.target.value)} disabled={busy||status==="closed"}/></label>
 <label className="text-sm sm:col-span-2">Private operator notes<textarea className="gth-input mt-1 w-full" maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)} disabled={busy}/></label><button disabled={busy} className="gth-btn gth-btn-gold min-h-11">{busy?"Saving…":"Save review"}</button></form>
 {message&&<p role="status" className="mt-2 text-sm">{message}</p>}<details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Follow-up draft · review before sending</summary><p className="mt-3 whitespace-pre-wrap leading-6">{draft}</p><button type="button" className="gth-btn mt-3 min-h-11" onClick={async()=>{try{await navigator.clipboard.writeText(draft);setMessage("Draft copied. No message has been sent.");}catch{setMessage("Copy the draft manually.");}}}>Copy draft</button></details></article>;
}
export default function EnquiryInbox(){
 const [items,setItems]=useState<Enquiry[]>([]),[jobs,setJobs]=useState<Job[]|null>(null),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[cursor,setCursor]=useState<number|null>(null);const generation=useRef(0);
 const load=useCallback(async(before?:number)=>{const current=++generation.current;setBusy(true);setMessage("");try{const q=new URLSearchParams();if(status)q.set("status",status);if(before)q.set("before",String(before));const result=await api("/api/admin/intelligence-leads?"+q);if(current===generation.current){setItems(result.items??[]);setJobs(result.refresh_jobs);setCursor(result.next_cursor);}}catch(error){if(current===generation.current){setItems([]);setMessage(error instanceof Error?error.message:"Private inbox unavailable");}}finally{if(current===generation.current)setBusy(false);}},[status]);
 useEffect(()=>{void load();return()=>{generation.current++;};},[load]);
 return <main className="gth-container min-h-screen py-12 text-[var(--text)]"><div className="mx-auto max-w-5xl"><Link href="/admin/operations" className="text-sm underline">Operations / Admin sign-in</Link><h1 className="mt-5 text-3xl font-semibold">Private enquiry inbox</h1>
 <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">Buyer requirements, project research and group hospitality requests. Only authorised administrators can load contacts. Review statuses and dates do not automatically contact customers or confirm suppliers.</p>
 <div className="my-6 flex flex-wrap gap-3"><select aria-label="Filter enquiry status" className="gth-input min-h-11" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{ENQUIRY_STATUSES.map(s=><option key={s}>{s}</option>)}</select><button disabled={busy} onClick={()=>void load()} className="gth-btn gth-btn-gold min-h-11">{busy?"Loading…":"Refresh private inbox"}</button></div>
 {message&&<p role="alert" className="my-4 text-sm">{message}</p>}{!busy&&!message&&items.length===0&&<p className="gth-glass rounded-xl p-5">No matching enquiries have been submitted. Directory records are never converted into customer contacts.</p>}
 <div className="space-y-4">{items.map(row=><Card key={row.id+":"+row.updated_at} row={row} onSave={updated=>setItems(previous=>previous.map(item=>item.id===updated.id?updated:item))}/>)}</div>
 {cursor&&<button className="gth-btn my-5 min-h-11" disabled={busy} onClick={()=>void load(cursor)}>Older enquiries</button>}
 {jobs&&<section className="gth-glass mt-8 rounded-xl p-5"><h2 className="text-lg font-semibold">Public-source index refresh</h2>{jobs.map(j=><p key={j.sector} className="mt-3 text-sm">{j.sector} · {j.last_status} · last successful refresh: {j.last_success_at?new Date(j.last_success_at).toLocaleString():"Not run yet"} · {j.saved} newly indexed from {j.scanned} scanned in that batch</p>)}</section>}</div></main>;
}
