"use client";
import {useCallback,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {TENDER_SERVICES,type ServiceQueueItem} from "@/lib/tender/services";
export default function TenderServicesDashboard(){
  const [items,setItems]=useState<ServiceQueueItem[]>([]),[total,setTotal]=useState<number|null>(null);
  const [status,setStatus]=useState("new"),[page,setPage]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [quote,setQuote]=useState<ServiceQueueItem|null>(null),[fee,setFee]=useState(""),[currency,setCurrency]=useState("INR");
  const [scope,setScope]=useState(""),[terms,setTerms]=useState("");
  const token=async()=>{
    const {data,error}=await supabase.auth.getSession();
    if(error||!data.session?.access_token)throw new Error("Sign in with your administrator account from Operations first.");
    return data.session.access_token;
  };
  const load=useCallback(async(filter:string,nextPage:number)=>{
    const bearer=await token();
    const response=await fetch(`/api/admin/tender-services?status=${filter}&page=${nextPage}`,{
      headers:{Authorization:`Bearer ${bearer}`},cache:"no-store",signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Could not load service requests.");
    setItems(data.items);setTotal(data.total);setStatus(filter);setPage(nextPage);setQuote(null);
  },[]);
  async function refresh(filter=status,nextPage=page){
    setBusy(true);setMessage("");
    try{await load(filter,nextPage);}catch(error){setItems([]);setTotal(null);setQuote(null);setMessage(error instanceof Error?error.message:"Service queue unavailable.");}
    finally{setBusy(false);}
  }
  async function update(item:ServiceQueueItem,nextStatus:"reviewing"|"closed"){
    setBusy(true);setMessage("");
    try{
      const bearer=await token();
      const response=await fetch("/api/admin/partners",{method:"POST",headers:{Authorization:`Bearer ${bearer}`,"Content-Type":"application/json"},
        body:JSON.stringify({id:item.request_id,status:nextStatus}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not update request.");
      await load(status,page);setMessage(`Request marked ${nextStatus}.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Update unavailable.");}
    finally{setBusy(false);}
  }
  const serviceName=(id:string)=>TENDER_SERVICES.find(service=>service.id===id)?.name??"Tender assistance";
  const quoteReady=quote&&Number(fee)>0&&Number(fee)<=100000000&&scope.trim().length>=20&&terms.trim().length>=20;
  const mail=quoteReady&&quote?`mailto:${encodeURIComponent(quote.contact_email)}?subject=${encodeURIComponent(`GTH PRO service quote · ${serviceName(quote.service)}`)}&body=${encodeURIComponent(`Hello ${quote.contact_name},\n\nRegarding your request ${quote.request_id}:\n${serviceName(quote.service)}${quote.tender_title?`\nTender: ${quote.tender_title}`:""}\n\nScope and deliverables:\n${scope.trim()}\n\nService fee: ${currency} ${Number(fee).toFixed(2)}\n\nDelivery, taxes, payment and cancellation terms:\n${terms.trim()}\n\nPlease confirm acceptance of this scope and fee before work begins. Tender fees and EMD must be paid only through the official authority. Assistance does not guarantee a contract award.\n\nGTH PRO` )}`:"";
  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-9 text-[var(--text)] sm:px-6">
    <Link href="/admin/operations" className="inline-flex min-h-11 items-center text-sm text-[var(--gold)] underline">Operations & administrator sign-in</Link>
    <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Private · Tender services</p>
    <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Service enquiries & quote workflow</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Review requests, agree on a service scope and draft a fee quote. A request or closed review is not a paid invoice. Payment collection and reconciliation are handled separately.</p>
    <div className="mt-6 flex flex-wrap items-end gap-3">
      <label className="text-sm font-semibold">Queue<select className="gth-input mt-2 block" disabled={busy} value={status} onChange={event=>{void refresh(event.target.value,1);}}><option value="new">New requests</option><option value="reviewing">Reviewing</option><option value="closed">Closed</option></select></label>
      <button disabled={busy} type="button" onClick={()=>{void refresh();}} className="gth-btn gth-btn-gold inline-flex items-center justify-center">{busy?"Loading…":"Load service queue"}</button>
      {total!==null&&<p className="py-3 text-sm text-[var(--text-soft)]">{total} requests · {status}</p>}
    </div>
    {message&&<p role="status" className="mt-5 rounded-xl border border-[var(--border)] p-4 text-sm leading-7">{message}</p>}
    {total===0&&<p role="status" className="mt-7 text-sm text-[var(--text-soft)]">No requests in this queue.</p>}
    <section aria-label="Service requests" className="mt-7 grid gap-5 lg:grid-cols-2">{items.map(item=><article key={item.request_id} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{item.status} · {serviceName(item.service)}</p><h2 className="mt-3 break-words text-lg font-semibold">{item.organisation}</h2>
      <dl className="mt-4 space-y-3 break-words text-sm"><div><dt className="text-xs text-[var(--text-soft)]">Contact</dt><dd className="mt-1">{item.contact_name} · {item.country}</dd><dd className="mt-1 break-all"><a href={`mailto:${encodeURIComponent(item.contact_email)}`} className="text-[var(--gold)] underline">{item.contact_email}</a></dd><dd className="mt-1"><a href={`tel:${item.phone}`} className="text-[var(--gold)] underline">{item.phone}</a></dd></div><div><dt className="text-xs text-[var(--text-soft)]">Requirements</dt><dd className="mt-1 whitespace-pre-wrap leading-7">{item.notes}</dd></div><div><dt className="text-xs text-[var(--text-soft)]">Received (UTC)</dt><dd className="mt-1">{new Date(item.submitted_at).toISOString().replace("T"," ").slice(0,19)}</dd></div><div><dt className="text-xs text-[var(--text-soft)]">Reference</dt><dd className="mt-1 break-all font-mono text-xs">{item.request_id}</dd></div></dl>
      {item.tender_id&&<Link href={`/tender/${item.tender_id}`} className="mt-4 inline-flex min-h-11 items-center break-words text-sm text-[var(--gold)] underline">{item.tender_title||"View associated tender"}</Link>}
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy} className="gth-btn inline-flex items-center justify-center" onClick={()=>{setQuote(item);setFee("");setScope("");setTerms("");}}>Prepare quote reply</button>{item.status==="new"&&<button type="button" disabled={busy} className="gth-btn inline-flex items-center justify-center" onClick={()=>{void update(item,"reviewing");}}>Mark reviewing</button>}{item.status!=="closed"&&<button type="button" disabled={busy} className="gth-btn inline-flex items-center justify-center" onClick={()=>{void update(item,"closed");}}>Close review</button>}</div>
    </article>)}</section>
    {total!==null&&total>20&&<nav aria-label="Service queue pages" className="mt-6 flex flex-wrap items-center gap-4"><button type="button" className="gth-btn" disabled={busy||page===1} onClick={()=>{void refresh(status,page-1);}}>Previous</button><span className="text-sm">Page {page} of {Math.max(1,Math.ceil(total/20))}</span><button type="button" className="gth-btn" disabled={busy||page*20>=total} onClick={()=>{void refresh(status,page+1);}}>Next</button></nav>}
    {quote&&<section aria-labelledby="quote-title" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7"><h2 id="quote-title" className="text-xl font-semibold">Quote for {quote.organisation}</h2><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Complete the commercial terms, then open your email app to review and send the quote. Drafting a reply does not send an email, save a quote or collect a payment.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Service fee<input className="gth-input mt-2 w-full" type="number" min="0.01" max="100000000" step="0.01" value={fee} onChange={event=>setFee(event.target.value)}/></label><label className="text-sm font-semibold">Currency<select className="gth-input mt-2 w-full" value={currency} onChange={event=>setCurrency(event.target.value)}>{["INR","USD","EUR","GBP","AED"].map(code=><option key={code}>{code}</option>)}</select></label><label className="text-sm font-semibold sm:col-span-2">Scope and deliverables<textarea className="gth-input mt-2 w-full" rows={4} minLength={20} maxLength={1500} value={scope} onChange={event=>setScope(event.target.value)}/></label><label className="text-sm font-semibold sm:col-span-2">Delivery, taxes, payment and cancellation terms<textarea className="gth-input mt-2 w-full" rows={4} minLength={20} maxLength={1500} value={terms} onChange={event=>setTerms(event.target.value)}/></label></div><div className="mt-5 flex flex-wrap gap-3">{mail?<a className="gth-btn gth-btn-gold inline-flex items-center justify-center" href={mail}>Open quote draft in email app</a>:<p className="text-sm text-[var(--text-soft)]">Enter a positive fee and at least 20 characters in each terms field.</p>}<button type="button" className="gth-btn inline-flex items-center justify-center" onClick={()=>setQuote(null)}>Close quote composer</button></div></section>}
  </main>;
}
