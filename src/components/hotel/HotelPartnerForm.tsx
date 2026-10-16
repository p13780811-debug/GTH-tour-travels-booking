"use client";
import {useEffect,useState} from "react";
import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
import Link from "next/link";
import {Building2,Camera,CheckCircle2,ShieldCheck,Upload,Mail,ArrowUpRight} from "lucide-react";

type Submission={id:string;hotel_name:string;city:string;status:string;photo_count:number;published_hotel_id:string|null;created_at:string};
const MAX_FILES=6,MAX_BYTES=3*1024*1024;
const INPUT="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)]";
const LABEL="block text-sm font-semibold text-[var(--text)]";
const TYPES=["hotel","resort","guest_house","apartment","hostel","motel"] as const;
const countryOptions=[["IN","India"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"],["SG","Singapore"],["TH","Thailand"],["FR","France"]];
export default function HotelPartnerForm(){
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState("");
 const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState("");
 const [error,setError]=useState("");
 const [history,setHistory]=useState<Submission[]>([]);
 const [selectedId,setSelectedId]=useState("");
 useEffect(()=>{
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session);});
  const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
  return()=>{active=false;listener.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!session){setHistory([]);return;}
  let active=true;
  void fetch("/api/hotels/partner/submissions",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"})
   .then(async result=>{if(!result.ok)throw Error();return result.json() as Promise<Submission[]>;})
   .then(rows=>{if(active)setHistory(rows);}).catch(()=>{if(active)setError("Previous hotel submissions could not be loaded.");});
  return()=>{active=false;};
 },[session,status]);
 async function requestSignIn(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setError("");setStatus("");
  try{
   const candidate=email.trim();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)||candidate.length>254)throw Error("Enter a valid email");
   const {error:authError}=await supabase.auth.signInWithOtp({
    email:candidate,options:{emailRedirectTo:window.location.origin+"/hotels/list-your-property"}
   });
   if(authError)throw Error("Unable to send sign-in link. Check your email rate limit and retry.");
   setStatus("Check your email for a sign-in link, then return to this page.");
  }catch(failure){setError(failure instanceof Error?failure.message:"Sign-in unavailable");}
  finally{setBusy(false);}
 }
 function checkFiles(input:File[],remaining:number):File[]{
  if(!input.length||input.length>remaining)throw Error("Select 1 to "+remaining+" hotel photos");
  if(input.some(file=>file.size===0||file.size>MAX_BYTES||!["image/jpeg","image/png","image/webp"].includes(file.type)))
   throw Error("Each file must be a JPEG, PNG or WebP image, up to 3 MB");
  return input;
 }
 async function uploadPhotos(submissionId:string,startingSlot:number,input:File[],token:string){
  const photos=checkFiles(input,MAX_FILES-startingSlot);
  for(let i=0;i<photos.length;i++){
   const form=new FormData();
   form.append("submission_id",submissionId);
   form.append("slot",String(startingSlot+i));
   form.append("file",photos[i]);
   setStatus("Saving private hotel photo "+(i+1)+" of "+photos.length+"...");
   const response=await fetch("/api/hotels/partner/photos",{
    method:"POST",headers:{Authorization:"Bearer "+token},body:form
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({error:"Photo upload failed"}));
    throw Error(data.error||"Photo upload failed");
   }
  }
 }
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!session)return;setBusy(true);setError("");setStatus("");
  const form=event.currentTarget;
  try{
   checkFiles(files,MAX_FILES);
   const source=Object.fromEntries(new FormData(form));
   const payload={
    ...source,
    photo_rights_confirmed:source.photo_rights_confirmed==="yes",
    owner_authorised:source.owner_authorised==="yes",
   };
   const response=await fetch("/api/hotels/partner/submissions",{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
    body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"Hotel submission failed");
   const id=String(result.id);
   setSelectedId(id);
   await uploadPhotos(id,0,files,session.access_token);
   setStatus("Hotel and photos saved privately for administrator review. No public listing yet.");
   setFiles([]);form.reset();
  }catch(failure){
   setError(failure instanceof Error?failure.message:"Hotel upload failed");
  }finally{setBusy(false);}
 }
 async function resumePhotos(submissionId:string,startingSlot:number){
  if(!session||busy)return;setBusy(true);setError("");setStatus("");
  try{
   await uploadPhotos(submissionId,startingSlot,files,session.access_token);
   setStatus("Additional private photos saved. Review is still pending.");
   setFiles([]);setSelectedId("");
  }catch(failure){setError(failure instanceof Error?failure.message:"Upload failed");}
  finally{setBusy(false);}
 }
 const photoInput=<label className={LABEL+" sm:col-span-2"}>Original hotel photographs (up to 6) *
   <input type="file" accept="image/jpeg,image/png,image/webp" multiple
    onChange={event=>{const selected=Array.from(event.target.files||[]);setFiles(selected);}}
    className={INPUT+" file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--card)] file:px-3 file:py-2"}/>
   <span className="mt-2 block text-xs font-normal leading-6 text-[var(--text-soft)]">
    Photos you own or have permission to publish. Each image max 3 MB, converted to WebP. No Google images or hotel photos copied from another website.
   </span>
 </label>;
 return <div className="space-y-8">
  {!session?<section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
   <Mail className="text-[var(--gold)]" size={25}/>
   <h2 className="mt-3 text-2xl font-semibold">Sign in as a hotel owner</h2>
   <p className="my-3 text-sm leading-7 text-[var(--text-soft)]">Use your email to manage private submissions and photos. No payment or Google Cloud account required.</p>
   <form onSubmit={event=>void requestSignIn(event)} className="flex flex-col gap-3 sm:flex-row">
    <input type="email" required maxLength={254} autoComplete="email" aria-label="Hotel owner email" value={email}
     onChange={event=>setEmail(event.target.value)} placeholder="owner@hotel.com" className={INPUT+" mt-0 flex-1"}/>
    <button type="submit" disabled={busy} className="gth-btn-gold min-h-12 rounded-xl px-5 text-sm font-semibold disabled:opacity-50">
     {busy?"Sending...":"Email sign-in link"}
    </button>
   </form>
  </section>:<>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
    <span><ShieldCheck size={17} className="mr-2 inline text-[var(--gold)]"/> Signed in as {session.user.email}</span>
    <button type="button" onClick={()=>void supabase.auth.signOut()} className="underline">Sign out</button>
   </div>
   <form onSubmit={event=>void submit(event)} className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
    <h2 className="flex items-center gap-2 text-2xl font-semibold"><Building2 className="text-[var(--gold)]"/> Your hotel inventory</h2>
    <p className="mt-3 text-sm text-[var(--text-soft)]">Hotel record and original photos go into private review first. Genuine, reviewed listings appear in hotel search after approval.</p>
    <fieldset disabled={busy} className="mt-6 grid gap-5 sm:grid-cols-2">
     <label className={LABEL}>Hotel or property name *<input name="hotel_name" required minLength={3} maxLength={180} className={INPUT}/></label>
     <label className={LABEL}>City *<input name="city" required minLength={2} maxLength={100} className={INPUT}/></label>
     <label className={LABEL}>Country *<select name="country_code" required defaultValue="IN" className={INPUT}>
      {countryOptions.map(([code,label])=><option key={code} value={code}>{label}</option>)}
     </select></label>
     <label className={LABEL}>Accommodation category *<select name="category" required defaultValue="hotel" className={INPUT}>
      {TYPES.map(value=><option value={value} key={value}>{value.replaceAll("_"," ")}</option>)}
     </select></label>
     <label className={LABEL+" sm:col-span-2"}>Full hotel address *<input name="address" required minLength={8} maxLength={350} className={INPUT}/></label>
     <label className={LABEL}>Contact / authorised person *<input name="owner_name" required minLength={2} maxLength={120} autoComplete="name" className={INPUT}/></label>
     <label className={LABEL}>Hotel website (optional)<input name="website" type="url" maxLength={500} placeholder="https://your-hotel.com" className={INPUT}/></label>
     <label className={LABEL+" sm:col-span-2"}>Description of your real hotel *<textarea name="description" required minLength={40} maxLength={3000}
      rows={5} placeholder="Describe the property, rooms and actual facilities without unverified promises." className={INPUT}/></label>
     {photoInput}
     <input type="text" name="website_check" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
     <label className="flex gap-3 text-sm leading-6 sm:col-span-2"><input type="checkbox" name="owner_authorised" value="yes" required/>
      I am the owner or have permission to list this hotel and represent its inventory.</label>
     <label className="flex gap-3 text-sm leading-6 sm:col-span-2"><input type="checkbox" name="photo_rights_confirmed" value="yes" required/>
      I own or have publication permission for all submitted photos and approve displaying them after review.</label>
     <p className="text-xs leading-6 text-[var(--text-soft)] sm:col-span-2">This is free hotel listing submission, not a guaranteed booking or verified price. Your enquiry and documents are handled under our <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.</p>
     <button type="submit" disabled={busy} className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold disabled:opacity-50 sm:col-span-2">
      <Upload size={17}/>{busy?"Saving hotel and photos...":"Submit hotel for review"}
     </button>
    </fieldset>
   </form>
   <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Camera size={20}/> My hotel submissions</h2>
    <div className="mt-4 space-y-3">
     {history.length===0?<p className="text-sm text-[var(--text-soft)]">No hotel submissions yet.</p>:
      history.map(entry=><article key={entry.id} className="rounded-xl border border-[var(--border)] p-4">
       <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-semibold">{entry.hotel_name}</h3>
         <p className="mt-1 text-xs text-[var(--text-soft)]">{entry.city} · {entry.photo_count} photos · {entry.status}</p></div>
        {entry.published_hotel_id&&entry.status==="approved"&&<Link className="inline-flex items-center gap-1 text-sm underline" href={"/hotels/stay/"+entry.published_hotel_id}>
         View published hotel <ArrowUpRight size={15}/></Link>}
       </div>
       {entry.status==="pending"&&entry.photo_count<6&&<div className="mt-3">
        <button type="button" className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold disabled:opacity-50"
          disabled={busy||files.length===0} onClick={()=>{setSelectedId(entry.id);void resumePhotos(entry.id,entry.photo_count);}}>
          Add selected photos ({6-entry.photo_count} slots left)
        </button>
        {selectedId===entry.id&&<p className="mt-2 text-xs text-[var(--text-soft)]">Use the photo picker above, then add images to this submission.</p>}
       </div>}
      </article>)}
    </div>
   </section>
  </>}
  {status&&<p role="status" className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6"><CheckCircle2 size={18} className="shrink-0 text-[var(--gold)]"/>{status}</p>}
  {error&&<p role="alert" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">{error}</p>}
 </div>;
}
