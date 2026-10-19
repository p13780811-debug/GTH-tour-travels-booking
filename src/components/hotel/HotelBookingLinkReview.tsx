"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
import {ExternalLink,ShieldCheck,CheckCircle2} from "lucide-react";
type Mapping={id:number;catalog_source:string|null;catalog_source_id:string|null;reviewed_hotel_id:string|null;provider:string;provider_property_id:string;provider_property_url:string;affiliate_url:string;hotel_name_at_provider:string;created_at:string};
type Confirm={property:boolean;affiliate:boolean};
export default function HotelBookingLinkReview(){
 const [items,setItems]=useState<Mapping[]>([]);
 const [token,setToken]=useState("");
 const [checks,setChecks]=useState<Record<number,Confirm>>({});
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setToken(data.session?.access_token||"")});
  const sub=supabase.auth.onAuthStateChange((_ev,s)=>setToken(s?.access_token||""));
  return()=>{active=false;sub.data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!token){setItems([]);return;}
  const controller=new AbortController();
  void fetch("/api/hotels/booking-links/admin",{headers:{Authorization:"Bearer "+token},cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error(r.status===403?"Admin role required":"Partner review queue unavailable");return r.json() as Promise<Mapping[]>})
   .then(data=>{if(!controller.signal.aborted){setItems(data);setMessage("");}})
   .catch(()=>{if(!controller.signal.aborted)setMessage("Only verified administrators can view affiliate matches. Sign in above, then reload.")});
  return()=>controller.abort();
 },[token]);
 async function review(id:number,action:"approve"|"disable"){
  if(!token||busy)return;
  const c=checks[id]||{property:false,affiliate:false};
  if(action==="approve"&&(!c.property||!c.affiliate)){setMessage("Confirm both property identity and active affiliate program first.");return;}
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/hotels/booking-links/admin",{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({id,action,exact_hotel_confirmed:c.property,affiliate_program_confirmed:c.affiliate})
   });
   const body:unknown=await r.json();
   if(!r.ok)throw Error(body&&typeof body==="object"&&"error" in body?String(body.error):"Review failed");
   setItems(prev=>prev.filter(x=>x.id!==id));
   setMessage("Hotel-specific partner link reviewed. Only approved identity mappings can show Book Now.");
  }catch(err){setMessage(err instanceof Error?err.message:"Review failed");}
  finally{setBusy(false);}
 }
 return <section aria-labelledby="hotel-affiliate-review" className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
  <div className="flex items-center gap-2"><ShieldCheck size={18}/><h2 id="hotel-affiliate-review" className="text-xl font-semibold">Exact hotel affiliate matches</h2></div>
  <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">Review the original OSM hotel identity, matching supplier property ID, and Travelpayouts-approved affiliate URL. This queue is private. Generic city search links must never be approved as hotel booking links.</p>
  <p role="status" className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
  {token&&items.length===0&&<p className="mt-4 text-sm">No pending exact-property matches in this review window.</p>}
  <div className="mt-5 space-y-4">
  {items.map(row=><article key={row.id} className="rounded-xl border border-[var(--border)] p-4">
   <h3 className="text-base font-semibold">{row.hotel_name_at_provider}</h3>
   <p className="mt-2 break-all text-xs text-[var(--text-soft)]">Local source: {row.catalog_source?row.catalog_source+":"+row.catalog_source_id:row.reviewed_hotel_id} · {row.provider} property ID: {row.provider_property_id}</p>
   <div className="mt-3 flex flex-wrap gap-4 text-xs">
    {row.catalog_source==="osm"&&row.catalog_source_id&&<a href={"https://www.openstreetmap.org/"+row.catalog_source_id} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">Original mapped hotel <ExternalLink size={13}/></a>}
    <a href={row.provider_property_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">Supplier property page <ExternalLink size={13}/></a>
    <a href={row.affiliate_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">Affiliate destination <ExternalLink size={13}/></a>
   </div>
   <label className="mt-4 flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={checks[row.id]?.property||false}
    onChange={e=>setChecks(old=>({...old,[row.id]:{property:e.target.checked,affiliate:old[row.id]?.affiliate||false}}))}/>
     I checked the supplier's exact hotel identity, not just a similar name</label>
   <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={checks[row.id]?.affiliate||false}
    onChange={e=>setChecks(old=>({...old,[row.id]:{property:old[row.id]?.property||false,affiliate:e.target.checked}}))}/>
     This property deep link was generated through my approved affiliate program</label>
   <button type="button" disabled={busy||!checks[row.id]?.property||!checks[row.id]?.affiliate}
    onClick={()=>void review(row.id,"approve")} className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50">
    <CheckCircle2 size={15}/> Approve exact hotel booking link</button>
  </article>)}
  </div>
 </section>;
}
