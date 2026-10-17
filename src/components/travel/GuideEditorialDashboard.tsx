"use client";
import {useEffect,useState} from "react";
import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
type Media={id:string;guide_slug:string;source_page:string;license_type:string;license_url:string;attribution_text:string;alt_text:string;
 image_url:string;width:number;height:number;is_hero:boolean;editorial_approved:boolean;rights_reviewed_at:string|null};
type Guide={slug:string;status:"draft"|"published";content_version:number;editorial_reviewed_at:string|null};
export default function GuideEditorialDashboard(){
 const [session,setSession]=useState<Session|null>(null);
 const [guides,setGuides]=useState<Guide[]>([]),[media,setMedia]=useState<Media[]>([]);
 const [confirmed,setConfirmed]=useState<Record<string,boolean>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{
  let active=true;
  void supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session);});
  const {data}=supabase.auth.onAuthStateChange((_event,next)=>{if(active)setSession(next);});
  return()=>{active=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!session){setGuides([]);setMedia([]);return;}
  let mounted=true;setError("");
  void fetch("/api/admin/guides",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error(response.status===403?"Administrator role required":"Guide review queue unavailable");return response.json();})
   .then(data=>{if(mounted){setGuides(Array.isArray(data.guides)?data.guides:[]);setMedia(Array.isArray(data.media)?data.media:[]);}})
   .catch(e=>{if(mounted)setError(e instanceof Error?e.message:"Review unavailable");});
  return()=>{mounted=false;};
 },[session,message]);
 async function act(body:Record<string,unknown>){
  if(!session||busy)return;setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/guides",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json();if(!response.ok)throw Error(result.error||"Review rejected");
   setMessage("Guide review saved. Public guide and sitemap gates recheck approvals.");
   setConfirmed({});
  }catch(e){setError(e instanceof Error?e.message:"Review unavailable");}finally{setBusy(false);}
 }
 if(!session)return <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">
  Sign in with your provisioned GTH PRO admin account to review guide copy and Wikimedia Commons photo rights.</p>;
 return <div className="space-y-6">
  <p className="text-sm text-[var(--text-soft)]">Only app-metadata authorized administrators can approve rights or indexing. Review each Commons source page and the full destination article before publishing.</p>
  {guides.map(guide=>{
   const photos=media.filter(m=>m.guide_slug===guide.slug);
   const approved=photos.some(m=>m.editorial_approved&&m.is_hero);
   const ready=approved&&guide.status==="published";
   return <section key={guide.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div><h2 className="text-lg font-bold">{guide.slug}</h2>
      <p className="text-xs text-[var(--text-soft)]">Content v{guide.content_version} · {guide.status} · {approved?"Hero rights approved":"No approved hero"}</p></div>
     <a href={"/guides/"+guide.slug} target="_blank" rel="noopener noreferrer" className="text-xs underline">Review guide page ↗</a>
    </div>
    <div className="mt-4 space-y-3">{photos.length===0?<p className="text-xs text-[var(--text-soft)]">No verified-license media candidates imported yet. The scheduled Commons metadata queue feeds this list.</p>:photos.map(photo=><article key={photo.id} className="rounded-xl border border-[var(--border)] p-3">
     <div className="flex gap-3">
      <img src={photo.image_url} width="130" height="82" alt={photo.alt_text} loading="lazy" className="h-20 w-32 shrink-0 rounded-lg object-cover"/>
      <div className="min-w-0 text-xs"><p>{photo.attribution_text}</p><p className="mt-1">{photo.license_type} · {photo.width}×{photo.height}</p>
       <p className="mt-1 flex flex-wrap gap-2"><a href={photo.source_page} target="_blank" rel="noopener noreferrer" className="underline">Original image</a>
        <a href={photo.license_url} target="_blank" rel="noopener noreferrer" className="underline">License text</a></p>
      </div>
     </div>
     <label className="mt-3 flex items-start gap-2 text-xs">
      <input type="checkbox" checked={confirmed[photo.id]||false} onChange={e=>setConfirmed(old=>({...old,[photo.id]:e.target.checked}))}/>
      I inspected the Commons file, source license, required attribution, actual location identity and photo suitability.
     </label>
     <button type="button" disabled={busy||(!photo.editorial_approved&&!confirmed[photo.id])} onClick={()=>void act({action:photo.editorial_approved?"revoke_media":"approve_media",id:photo.id,
        source_checked:true,destination_checked:true})} className="mt-3 rounded-lg border border-[var(--border)] px-3 py-2 text-xs disabled:opacity-50">
      {photo.editorial_approved?"Revoke photo approval":"Approve licensed hero"}</button>
    </article>)}</div>
    <label className="mt-5 flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed[guide.slug]||false}
      onChange={e=>setConfirmed(old=>({...old,[guide.slug]:e.target.checked}))}/>
      I reviewed every section, FAQs, links, timeliness and unique value of this guide.
    </label>
    <div className="mt-3 flex flex-wrap items-center gap-3">
     <button type="button" disabled={busy||(guide.status!=="published"&&(!approved||!confirmed[guide.slug]))}
      onClick={()=>void act({action:guide.status==="published"?"unpublish_guide":"publish_guide",slug:guide.slug,editorial_checked:true})}
      className="gth-btn-gold rounded-xl px-4 py-3 text-sm disabled:opacity-50">
       {guide.status==="published"?"Unpublish guide":"Approve guide for search"}</button>
     <span className="text-xs text-[var(--text-soft)]">{ready?"Media + editorial approval confirmed":"Not ready for SEO indexing"}</span>
    </div>
   </section>;
  })}
  {!guides.length&&!error&&<p className="text-sm text-[var(--text-soft)]">Guide migration may not have been applied yet.</p>}
  {message&&<p role="status" className="text-sm">{message}</p>}{error&&<p role="alert" className="text-sm">{error}</p>}
 </div>;
}
