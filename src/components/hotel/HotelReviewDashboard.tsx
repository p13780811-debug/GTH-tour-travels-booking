"use client";
import {useEffect,useState} from "react";
import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
import Link from "next/link";
import {ShieldCheck,Image as ImageIcon,CheckCircle2,XCircle} from "lucide-react";

type Review={
 id:string;hotel_name:string;city:string;country_code:string;address:string;category:string;description:string;
 owner_name:string;contact_email:string;website:string|null;
 owner_authorised:boolean;photo_rights_confirmed:boolean;
 status:string;created_at:string;published_hotel_id:string|null;
 photos:{slot:number;url:string}[];
};
export default function HotelReviewDashboard(){
 const [session,setSession]=useState<Session|null>(null);
 const [items,setItems]=useState<Review[]>([]);
 const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [verification,setVerification]=useState<Record<string,{business:boolean;photos:boolean}>>({});
 const [note,setNote]=useState("");
 const field="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm";
 useEffect(()=>{
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session);});
  const {data:subscription}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
  return()=>{active=false;subscription.subscription.unsubscribe();};
 },[]);
 async function refresh(token:string){
  const response=await fetch("/api/hotels/partner/admin",{
   headers:{Authorization:"Bearer "+token},cache:"no-store",
  });
  if(!response.ok)throw Error(response.status===403?"Admin permission required":"Hotel review queue unavailable");
  setItems(await response.json());
 }
 useEffect(()=>{
  if(!session){setItems([]);return;}
  void refresh(session.access_token).catch(err=>setError(err instanceof Error?err.message:"Review queue unavailable"));
 },[session]);
 async function signIn(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   const {error:authError}=await supabase.auth.signInWithOtp({
    email:email.trim(),options:{emailRedirectTo:window.location.origin+"/admin/hotels"}
   });
   if(authError)throw new Error("Unable to send admin sign-in email");
   setMessage("Check your email for the admin sign-in link.");
  }catch(err){setError(err instanceof Error?err.message:"Sign-in unavailable");}
  finally{setBusy(false);}
 }
 async function review(id:string,action:"approve"|"reject"){
  if(!session||busy)return;
  const checks=verification[id]||{business:false,photos:false};
  if(action==="approve"&&(!checks.business||!checks.photos)){
   setError("Verify business/owner authority and original photo rights before publishing.");return;
  }
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/hotels/partner/admin",{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
    body:JSON.stringify({submission_id:id,action,business_verified:checks.business,
      photo_rights_verified:checks.photos,review_note:note}),
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Hotel review could not be saved");
   setMessage(action==="approve"?"Reviewed hotel published in the public catalog":"Hotel submission rejected without publication");
   setVerification(current=>({...current,[id]:{business:false,photos:false}}));setNote("");
   await refresh(session.access_token);
  }catch(err){setError(err instanceof Error?err.message:"Review failed");}
  finally{setBusy(false);}
 }
 return <div className="space-y-6">
  {!session?<form onSubmit={event=>void signIn(event)} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
    <h2 className="text-xl font-semibold">Administrator sign-in</h2>
    <p className="my-3 text-sm text-[var(--text-soft)]">Only accounts with verified server-side admin permissions can view owner enquiries and photos.</p>
    <div className="flex flex-col gap-3 sm:flex-row">
     <input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}
      placeholder="Administrator email" aria-label="Administrator email" className={field+" flex-1"}/>
     <button type="submit" className="gth-btn-gold rounded-xl px-5" disabled={busy}>Send sign-in link</button>
    </div>
   </form>:<>
    <p className="text-sm text-[var(--text-soft)]">Signed in: {session.user.email}. Only manually checked hotels with original photo rights can be published.</p>
    <div className="flex flex-wrap gap-3">
     <button type="button" onClick={()=>{setError("");void refresh(session.access_token).catch(()=>setError("Could not load review queue"))}}
      className={field}>Refresh review queue</button>
     <button type="button" onClick={()=>void supabase.auth.signOut()} className={field}>Sign out</button>
    </div>
    {items.filter(item=>item.status==="pending").length===0&&<p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">No pending hotel submissions in the latest review window.</p>}
    {items.filter(item=>item.status==="pending").map(item=><article key={item.id} className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
     <h2 className="text-2xl font-semibold">{item.hotel_name}</h2>
     <p className="mt-2 text-sm text-[var(--text-soft)]">{item.city}, {item.country_code} · {item.category.replaceAll("_"," ")}</p>
     <p className="mt-2 text-sm">{item.address}</p>
     <p className="mt-4 text-sm leading-7">{item.description}</p>
     <p className="mt-4 text-xs text-[var(--text-soft)]">Submitted by {item.owner_name} · {item.contact_email}</p>
     {item.website&&<a className="mt-2 inline-block text-xs underline" href={item.website} target="_blank" rel="noopener noreferrer nofollow">Hotel website</a>}
     <p className="mt-3 text-xs text-[var(--text-soft)]">Owner authority declared: {item.owner_authorised?"Yes":"No"} · Photo rights declared: {item.photo_rights_confirmed?"Yes":"No"} (declarations require independent verification)</p>
     <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {item.photos.map(photo=><a key={photo.slot} href={photo.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-[var(--border)]">
       <img src={photo.url} alt={"Privately submitted hotel photo "+(photo.slot+1)} className="h-40 w-full object-cover" loading="lazy"/>
      </a>)}
      {!item.photos.length&&<p className="col-span-full flex items-center gap-2 text-sm text-[var(--text-soft)]"><ImageIcon size={17}/> No original photos attached yet</p>}
     </div>
     <fieldset className="mt-6 space-y-3 border-t border-[var(--border)] pt-5" disabled={busy}>
      <legend className="text-sm font-semibold">Manual verification before publishing</legend>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={verification[item.id]?.business||false} onChange={e=>setVerification(current=>({...current,[item.id]:{business:e.target.checked,photos:current[item.id]?.photos||false}}))}/> I independently checked this hotel's identity and the submitter's authority.</label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={verification[item.id]?.photos||false} onChange={e=>setVerification(current=>({...current,[item.id]:{business:current[item.id]?.business||false,photos:e.target.checked}}))}/> I independently checked rights to publish every selected hotel image.</label>
      <label className="block text-sm">Reason for rejection (optional)<textarea maxLength={400} rows={2} value={note} onChange={e=>setNote(e.target.value)} className={field+" mt-2 w-full"}/></label>
      <div className="flex flex-wrap gap-3">
       <button type="button" onClick={()=>void review(item.id,"approve")}
        disabled={busy||item.photos.length===0||!verification[item.id]?.business||!verification[item.id]?.photos}
        className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50">
        <CheckCircle2 size={17}/> Approve and publish</button>
       <button type="button" onClick={()=>void review(item.id,"reject")} disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold">
        <XCircle size={17}/> Reject</button>
      </div>
     </fieldset>
    </article>)}
    <Link href="/hotels" className="inline-block text-sm underline">Return to hotel marketplace</Link>
   </>}
   {message&&<p role="status" className="rounded-xl border border-[var(--border)] p-4 text-sm">{message}</p>}
   {error&&<p role="alert" className="rounded-xl border border-[var(--border)] p-4 text-sm">{error}</p>}
 </div>;
}
