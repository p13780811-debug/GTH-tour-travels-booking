"use client";
import { useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { readApiJson } from "@/lib/api-response";

type Approved={id:string;project_id:number;media_type:string;supplier:string;attribution:string|null;
 license_basis:string;permission_reference:string;status:string;reviewed_at:string};
type Published={id:string;claim_media_id:string;source_submission_id?:string;submission_media_index?:number;project_id:number;media_type:string;is_primary:boolean;published_at:string};
type Submission={id:string;title:string;property_id:number;media_urls:(string|null)[]};
type Queue={eligible:Approved[];published:Published[];submissions?:Submission[]};
type Candidate={id:string;project_id:number;rera_reference:string;source_key:string;source_url:string;
 media_type:string;agreement_reference:string;permission_reference:string;status:string};
async function adminToken(){
 const {data,error}=await supabase.auth.getSession();
 if(error||!data.session||data.session.user.app_metadata?.role!=="admin")
  throw new Error("Administrator sign-in required.");
 return data.session.access_token;
}
export default function MediaPublicationReview(){
 const [queue,setQueue]=useState<Queue>({eligible:[],published:[]});
 const [candidates,setCandidates]=useState<Candidate[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [notes,setNotes]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  try{
   const token=await adminToken();
   const headers={Authorization:`Bearer ${token}`};
   const [q,c]=await Promise.all([
    readApiJson<Queue>(await fetch("/api/admin/property-media-publication",{headers,cache:"no-store"})),
    readApiJson<Candidate[]>(await fetch("/api/admin/property-media-feeds",{headers,cache:"no-store"})),
   ]);
   setQueue(q);setCandidates(c);setError("");
  }catch(e){setQueue({eligible:[],published:[]});setCandidates([]);
   setError(e instanceof Error?e.message:"Review unavailable")}
 },[]);
 useEffect(()=>{void load()},[load]);
 const submit=async(id:string,action:"publish"|"take_down",photoIndex?:number)=>{
  setBusy(true);setError("");setNotice("");
  try{
   const token=await adminToken();
   await readApiJson(await fetch("/api/admin/property-media-publication",{
    method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify(photoIndex===undefined?{media_id:id,action,notes:notes[id]||""}:{submission_id:id,photo_index:photoIndex,action,notes:notes[`${id}:${photoIndex}`]||""}),
   }));
   setNotice(action==="publish"?"Publication approved: original project photo now eligible for display.":"Media taken down; public delivery access revoked.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Could not record decision")}
  finally{setBusy(false)}
 };
 return <main className="gth-container px-4 pb-28 pt-10">
  <div className="mx-auto max-w-5xl">
   <Link className="text-sm underline" href="/real-estate/claims-review">Back to private claim review</Link>
   <h1 className="mt-5 text-3xl font-bold">Property media publication</h1>
   <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">Candidate feed links never publish media. Confirm original project identity, authorization, image subject and rights evidence in the separate private review before publication. Use independent notes for every decision.</p>
   <button type="button" onClick={()=>void load()} className="gth-btn mt-5" disabled={busy}>Refresh queue</button>
   {error&&<p role="alert" className="mt-4">{error}</p>}{notice&&<p role="status" className="mt-4">{notice}</p>}
   <section className="mt-8"><h2 className="text-xl font-semibold">Authorized-feed candidates — {candidates.length}</h2>
    <p className="mt-2 text-xs text-[var(--text-muted)]">Candidates are metadata only. Exact RERA matching does not independently verify photo rights.</p>
    <div className="mt-4 grid gap-3">{candidates.map(item=><article key={item.id} className="gth-glass rounded-xl p-4">
     <strong>{item.rera_reference} · Project #{item.project_id}</strong>
     <p className="mt-2 break-all text-xs">Source: {item.source_key} · {item.media_type}</p>
     <p className="mt-1 break-all text-xs">Agreement: {item.agreement_reference}</p>
     <a className="mt-2 block break-all text-xs underline" href={item.source_url} target="_blank" rel="noopener noreferrer">Inspect external source manually</a>
    </article>)}</div>
   </section>
   <section className="mt-9"><h2 className="text-xl font-semibold">Owner, developer & partner photo review</h2>
    <p className="mt-3 text-sm opacity-70">Listing approval does not approve photographs. Inspect the exact property match and written rights evidence before each publication. The uploader cannot publish their own photos.</p>
    {(queue.submissions||[]).map(item=><article key={item.id} className="gth-glass mt-4 rounded-xl p-5"><h3 className="font-semibold">{item.title} · Project #{item.property_id}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{item.media_urls.map((url,index)=>{
      const key=`${item.id}:${index}`,published=queue.published.some(p=>p.source_submission_id===item.id&&p.submission_media_index===index);
      if(!url)return <p key={key} className="text-sm opacity-70">Photo {index+1}: invalid account-owned storage reference; publication withheld.</p>;
      return <div key={key}><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Inspect submitted photograph {index+1}</a><label className="mt-3 block text-sm">Property match & rights evidence / takedown notes<textarea className="gth-glass mt-2 min-h-20 w-full rounded-lg p-3" maxLength={1000} value={notes[key]||""} onChange={e=>setNotes(prev=>({...prev,[key]:e.target.value}))}/></label><button className="gth-btn mt-3" disabled={busy||(notes[key]||"").trim().length<20} onClick={()=>void submit(item.id,published?"take_down":"publish",index)}>{published?"Revoke photo publication":"Approve & publish photograph"}</button></div>
    })}</div></article>)}
   </section>
   <section className="mt-9"><h2 className="text-xl font-semibold">Rights-reviewed, not yet published</h2>
    <div className="mt-4 grid gap-4">{queue.eligible.filter(m=>!queue.published.some(p=>p.claim_media_id===m.id)).map(item=>
     <article key={item.id} className="gth-glass rounded-xl p-5">
      <h3 className="font-semibold">Project #{item.project_id} · {item.media_type}</h3>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Supplier: {item.supplier} · {item.license_basis}</p>
      <p className="mt-1 break-words text-xs text-[var(--text-muted)]">Rights evidence: {item.permission_reference}</p>
      {item.attribution&&<p className="mt-1 text-xs">Attribution: {item.attribution}</p>}
      <Link href="/real-estate/claims-review" className="mt-3 block text-xs underline">Recheck original private photo and approval history</Link>
      <label className="mt-4 block text-sm">Independent publication notes
       <textarea className="gth-glass mt-2 block min-h-20 w-full rounded-lg p-3" maxLength={1000}
         value={notes[item.id]||""} onChange={e=>setNotes(prev=>({...prev,[item.id]:e.target.value}))}/>
      </label>
      <button type="button" className="gth-btn-gold mt-3" disabled={busy||(notes[item.id]||"").trim().length<20}
       onClick={()=>void submit(item.id,"publish")}>Publish exact reviewed media</button>
     </article>)}</div>
   </section>
   <section className="mt-9"><h2 className="text-xl font-semibold">Published — takedown controls</h2>
    <div className="mt-4 grid gap-4">{queue.published.filter(item=>item.claim_media_id).map(item=><article className="gth-glass rounded-xl p-5" key={item.id}>
     <h3 className="font-semibold">Project #{item.project_id} · {item.media_type}</h3>
     <a href={`/api/property-media/${item.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs underline">Open reviewed public image</a>
     <label className="mt-4 block text-sm">Takedown reason
      <textarea className="gth-glass mt-2 block min-h-20 w-full rounded-lg p-3" maxLength={1000}
       value={notes[item.claim_media_id]||""} onChange={e=>setNotes(prev=>({...prev,[item.claim_media_id]:e.target.value}))}/>
     </label>
     <button type="button" className="gth-btn mt-3" disabled={busy||(notes[item.claim_media_id]||"").trim().length<20}
      onClick={()=>void submit(item.claim_media_id,"take_down")}>Revoke publication</button>
    </article>)}</div>
   </section>
  </div>
 </main>;
}
