"use client";
import {useState} from "react";
import {convertCurrency,displayCurrency,INVESTOR_CORRIDORS,type InvestorCurrency} from "@/lib/real-estate/investor-currency";
type Corridor=keyof typeof INVESTOR_CORRIDORS;
const codes=["INR","USD","AED","GBP"] as const;
export default function NriInvestorDesk(){
 const [enabled,setEnabled]=useState(false),[currency,setCurrency]=useState<InvestorCurrency>("INR"),[corridor,setCorridor]=useState<Corridor>("mmr");
 const [amount,setAmount]=useState(10000000),[roi,setRoi]=useState(5),[rate,setRate]=useState(8.5),[years,setYears]=useState(20);
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[consent,setConsent]=useState(false),[status,setStatus]=useState(""),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false);
 const field="mt-1 block min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text)]";
 const monthly=rate===0?amount/(years*12):amount*(rate/1200)*Math.pow(1+rate/1200,years*12)/(Math.pow(1+rate/1200,years*12)-1);
 const summary="GTH PRO NRI investor inquiry: "+INVESTOR_CORRIDORS[corridor].label+" | "+currency+" | Name: "+name+" | Email: "+email+" | Phone: "+phone;
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/real-estate/nri-inquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    full_name:name,email,phone_e164:phone,corridor,currency,consent_to_contact:consent,request_id:crypto.randomUUID()
   })});
   if(!response.ok)throw new Error("Please check the international phone format (+country code and number), email, and try again.");
   setSuccess(true);setStatus("Inquiry saved. You can also contact our team using the links below.");
  }catch(e){setStatus(e instanceof Error?e.message:"Unable to save inquiry.");}
  finally{setBusy(false);}
 }
 return <section aria-label="NRI and global investor desk" className="gth-glass mt-6 rounded-3xl p-5 sm:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="gold-text text-xs font-bold uppercase tracking-widest">International property research</p><h2 className="mt-2 text-xl font-bold">NRI &amp; Global Investor Mode</h2></div><label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="size-5 accent-[var(--gold)]"/> Enable investor mode</label></div>
  {enabled&&<div className="mt-5 space-y-5">
   <p className="text-sm text-[var(--text-soft)]">Illustrative currency conversions only; static reference rates, not live FX or transaction quotes. Search corridors do not guarantee available listings.</p>
   <div className="flex flex-wrap gap-2">{Object.entries(INVESTOR_CORRIDORS).map(([key,value])=><button type="button" key={key} aria-pressed={corridor===key} className="gth-btn" onClick={()=>{const selected=key as Corridor;setCorridor(selected);const url=new URL(window.location.href);if(value.country)url.searchParams.set("country",value.country);else url.searchParams.delete("country");if(value.city)url.searchParams.set("city",value.city);else url.searchParams.delete("city");url.searchParams.delete("page");window.history.replaceState(null,"",url);window.dispatchEvent(new Event("gth-search-load"));}}>{value.label}</button>)}</div>
   <label className="block text-sm">Display currency<select className={field} value={currency} onChange={e=>setCurrency(e.target.value as InvestorCurrency)}>{codes.map(c=><option key={c}>{c}</option>)}</select></label>
   <div className="grid gap-4 sm:grid-cols-3">
    <label className="text-sm">Illustrative investment (INR)<input className={field} type="number" min="100000" max="10000000000" value={amount} onChange={e=>setAmount(Math.min(1e10,Math.max(100000,Number(e.target.value)||100000)))}/></label>
    <label className="text-sm">Annual gross yield %<input className={field} type="number" min="0" max="30" step=".1" value={roi} onChange={e=>setRoi(Math.min(30,Math.max(0,Number(e.target.value)||0)))}/></label>
    <label className="text-sm">Interest rate %<input className={field} type="number" min="0" max="30" step=".1" value={rate} onChange={e=>setRate(Math.min(30,Math.max(0,Number(e.target.value)||0)))}/></label>
    <label className="text-sm">Loan tenure (years)<input className={field} type="number" min="1" max="40" value={years} onChange={e=>setYears(Math.min(40,Math.max(1,Number(e.target.value)||1)))}/></label>
   </div>
   <div className="grid gap-3 sm:grid-cols-3"><p>Investment<br/><strong>{displayCurrency(amount,"INR",currency)}</strong></p><p>Gross annual yield<br/><strong>{displayCurrency(amount*roi/100,"INR",currency)}</strong></p><p>Illustrative EMI (100% financed)<br/><strong>{displayCurrency(monthly,"INR",currency)}</strong></p></div>
   <p className="text-xs text-[var(--text-soft)]">Static reference: 1 USD ≈ ₹89. FX rate assumptions are fixed and may differ materially from market rates. Yield excludes costs and tax. EMI uses a hypothetical 100% loan, not an offer. Converted INR value: {convertCurrency(amount,"INR",currency)?.toLocaleString("en")} {currency}.</p>
   {!success?<form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Full name<input required minLength={2} maxLength={150} className={field} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label className="text-sm">Email<input required type="email" maxLength={150} className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label className="text-sm">International mobile (+country code)<input required type="tel" pattern="\\+[1-9][0-9]{7,14}" placeholder="+919876543210" className={field} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/> I consent to contact about this inquiry.</label>
    <button type="submit" disabled={busy} className="gth-btn gth-btn-gold sm:col-span-2">{busy?"Submitting…":"Request priority investor callback"}</button>
   </form>:<div className="flex flex-wrap gap-3"><a className="gth-btn" href={"mailto:official@gthproglobal.com?subject="+encodeURIComponent("GTH PRO NRI investor inquiry")+"&body="+encodeURIComponent(summary)}>Email GTH PRO</a><button type="button" className="gth-btn" onClick={()=>navigator.clipboard.writeText(summary).then(()=>setStatus("WhatsApp-ready inquiry copied.")).catch(()=>setStatus("Copy unavailable."))}>Copy WhatsApp-ready message</button></div>}
   {status&&<p role="status" className="text-sm">{status}</p>}
  </div>}
 </section>;
}
