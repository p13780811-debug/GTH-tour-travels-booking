"use client";
import {useEffect,useState} from "react";
import {COMMERCIAL_CURRENCIES,commercialDateInZone,type CommercialInput,type TenderCommercial} from "@/lib/tender/commercial";
export default function TenderCommercialControls({id,current,onSave}:{id:string;current:TenderCommercial|null;onSave:(input:CommercialInput)=>Promise<void>}){
 const [zone,setZone]=useState("UTC");
 useEffect(()=>setZone(Intl.DateTimeFormat().resolvedOptions().timeZone),[]);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [fee,setFee]=useState(current?(current.feeMinor/100).toFixed(2):""),[currency,setCurrency]=useState<string>(current?.currency??"INR"),[quoteRef,setQuoteRef]=useState(current?.quoteRef??"");
 const [stage,setStage]=useState<TenderCommercial["stage"]>(current?.stage==="quoted"?"accepted":current?.stage==="accepted"?"paid":"quoted"),[invoiceRef,setInvoiceRef]=useState(""),[paidDate,setPaidDate]=useState(""),[note,setNote]=useState("");
 return <section className="mt-5 border-t border-[var(--border)] pt-4">
  <p className="text-sm font-semibold">Commercial stage: {current?.stage??"No written quote recorded"}</p>
  {current&&<p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{current.currency} {(current.feeMinor/100).toFixed(2)} · Quote {current.quoteRef}{current.stage==="paid"?` · Invoice ${current.invoiceRef} · ${current.paidDate} ${current.paidZone??"UTC"}`:""} · Manual log</p>}
  {current?.stage==="paid"?<p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Payment recorded manually. Reconcile it with your invoice system; corrections belong in that system.</p>:<button type="button" onClick={()=>setOpen(!open)} className="gth-btn mt-3 inline-flex min-h-11 items-center justify-center">{open?"Close commercial log":"Record quote / commercial event"}</button>}
  {open&&current?.stage!=="paid"&&<form className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();if(busy)return;const fields=new FormData(e.currentTarget);setBusy(true);setError("");try{await onSave({id,expectedRevision:current?.revision??0,stage,fee,currency,quoteRef,invoiceRef,paidDate,paidZone:zone,note,confirmed:fields.get("confirmed")==="yes"});setOpen(false);}catch(failure){setError(failure instanceof Error?failure.message:"Could not record event");}finally{setBusy(false);}}}>
   <label className="min-w-0 text-sm">Event<select aria-label="Commercial event" disabled={busy} className="gth-input mt-2 w-full min-w-0" value={stage} onChange={e=>setStage(e.target.value as TenderCommercial["stage"])}><option value="quoted">Written quote shared / revised</option>{current?.stage==="quoted"&&<option value="accepted">Customer accepted the quote</option>}{current?.stage==="accepted"&&<option value="paid">Full quoted fee received — checked against invoice</option>}{current&&<option value="lost">Not proceeding</option>}</select></label>
   <label className="min-w-0 text-sm">Written quote reference<input required maxLength={80} className="gth-input mt-2 w-full min-w-0" value={quoteRef} onChange={e=>setQuoteRef(e.target.value)}/></label>
   <label className="min-w-0 text-sm">Quoted service fee<input required type="number" min="0.01" max="99999999.99" step="0.01" className="gth-input mt-2 w-full min-w-0" value={fee} onChange={e=>setFee(e.target.value)}/></label>
   <label className="min-w-0 text-sm">Currency<select aria-label="Quote currency" className="gth-input mt-2 w-full min-w-0" value={currency} onChange={e=>setCurrency(e.target.value)}>{COMMERCIAL_CURRENCIES.map(code=><option key={code}>{code}</option>)}</select></label>
   {stage==="paid"&&<><label className="min-w-0 text-sm">Invoice / receipt reference<input required maxLength={80} className="gth-input mt-2 w-full min-w-0" value={invoiceRef} onChange={e=>setInvoiceRef(e.target.value)}/></label><label className="min-w-0 text-sm">Payment date ({zone})<input required type="date" max={commercialDateInZone(new Date(),zone)} className="gth-input mt-2 w-full min-w-0" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/></label></>}
   <label className="min-w-0 text-sm sm:col-span-2">Internal event note<textarea maxLength={200} rows={2} className="gth-input mt-2 w-full min-w-0" value={note} onChange={e=>setNote(e.target.value)}/></label>
   <label className="flex items-start gap-3 text-xs leading-6 text-[var(--text-soft)] sm:col-span-2"><input required type="checkbox" name="confirmed" value="yes" className="mt-1"/>I checked this event against the written quote and customer acceptance. For a payment event, I confirm the full quoted service fee was received. This log does not send a quote, charge money or verify a bank transaction.</label>
   <button disabled={busy} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center justify-center sm:col-span-2">{busy?"Recording…":"Record confirmed commercial event"}</button>
   {error&&<p role="alert" className="text-sm sm:col-span-2">{error}</p>}
  </form>}
 </section>;
}
