"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { readApiJson } from "@/lib/api-response";
import LoginModal from "@/components/real-estate/auth/LoginModal";

type Claim = {
 id:string; claimant_id:string; project_id:number; rera_reference:string; claimant_role:string;
 legal_name:string; organization_name:string|null; authority_reference:string; created_at:string; status:string;
};
type Media = {
 id:string; claim_id:string; project_id:number; media_type:string; supplier:string; attribution:string|null;
 license_basis:string; permission_reference:string; original_url:string|null; created_at:string; status:string;
};
type Queue = { claims:Claim[]; media:Media[] };

export default function ProjectClaimReviewPage() {
 const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
 const [login,setLogin] = useState(false);
 const [queue,setQueue] = useState<Queue>({claims:[],media:[]});
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState("");
 const [notice,setNotice] = useState("");
 const [notes,setNotes] = useState<Record<string,string>>({});

 const access = useCallback(async () => {
  const {data,error} = await supabase.auth.getSession();
  if(error || !data.session) throw new Error("Administrator sign-in required.");
  return data.session.access_token;
 }, []);
 const load = useCallback(async () => {
  try {
   const bearer = await access();
   const rows = await readApiJson<Queue>(await fetch("/api/admin/project-claims", {
    headers:{Authorization:`Bearer ${bearer}`}, cache:"no-store",
   }));
   setQueue(rows); setError("");
  } catch(failure) {
   setQueue({claims:[],media:[]});
   setError(failure instanceof Error ? failure.message : "Queue unavailable");
  }
 }, [access]);
 useEffect(() => {
  let active = true;
  supabase.auth.getUser().then(({data}) => {
   if (!active) return;
   const admin = data.user?.app_metadata?.role === "admin";
   setLoggedIn(admin); if (admin) void load();
  }).catch(() => {if(active) setLoggedIn(false);});
  const {data} = supabase.auth.onAuthStateChange((_event,session) => {
   if (!active) return;
   const admin = session?.user?.app_metadata?.role === "admin";
   setLoggedIn(admin); if(admin) void load(); else setQueue({claims:[],media:[]});
  });
  return () => {active=false;data.subscription.unsubscribe();};
 }, [load]);
 const review = async (id:string,type:"claim"|"media",decision:"approved"|"rejected"|"taken_down") => {
  setBusy(true);setError("");setNotice("");
  try {
   const bearer = await access();
   await readApiJson(await fetch("/api/admin/project-claims", {
    method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${bearer}`},
    body:JSON.stringify({id,type,decision,notes:notes[id]||""}),
   }));
   setNotice(`Review recorded: ${decision}. Public project/media publication was NOT triggered.`);
   await load();
  } catch(failure) {
   setError(failure instanceof Error ? failure.message : "Review failed");
  } finally {setBusy(false);}
 };
 const preview = async (id:string) => {
  setBusy(true);setError("");
  try {
   const bearer = await access();
   const response = await readApiJson<{url:string}>(await fetch("/api/admin/project-claims/preview", {
    method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${bearer}`},
    body:JSON.stringify({id}),
   }));
   if(response?.url) window.open(response.url,"_blank","noopener,noreferrer");
  } catch(failure) {
   setError(failure instanceof Error ? failure.message : "Private preview unavailable");
  } finally {setBusy(false);}
 };
 return <main className="gth-container px-4 pt-10 pb-28">
  <div className="mx-auto max-w-5xl">
   <Link href="/real-estate/admin" className="underline text-sm">Back to Real Estate administration</Link>
   <h1 className="text-3xl font-bold mt-5">Project claims and image rights queue</h1>
   <p className="mt-3 leading-7 opacity-75">Only independently reviewed authority and exact project-media rights can be approved. Approving here never publishes a photo or authorizes a live unit listing.</p>
   {loggedIn === null && <p className="mt-6">Checking administration access…</p>}
   {loggedIn === false && <section className="gth-glass rounded-2xl mt-6 p-6"><p>Administrator authentication required.</p><button type="button" onClick={()=>setLogin(true)} className="gth-btn mt-4">Sign in</button></section>}
   {loggedIn === true && <>
    <button type="button" className="gth-btn mt-5" disabled={busy} onClick={()=>void load()}>Refresh private queue</button>
    <h2 className="text-xl font-bold mt-10">Project authorization — {queue.claims.length} pending</h2>
    <div className="grid gap-4 mt-4">{queue.claims.map(item=><article key={item.id} className="gth-glass rounded-2xl p-5">
     <h3 className="font-bold">{item.rera_reference} · Project #{item.project_id}</h3>
     <p className="mt-2 text-sm">Name: {item.legal_name} · Role: {item.claimant_role} · Organization: {item.organization_name||"Not provided"}</p>
     <p className="text-sm mt-2 break-words">Authority evidence: {item.authority_reference}</p>
     <p className="text-xs mt-2 opacity-60">Submitted {new Date(item.created_at).toLocaleString()}</p>
     <label className="grid gap-2 mt-4 text-sm">Independent verification notes (20+ characters required for approval)
      <textarea rows={2} maxLength={1000} className="gth-glass rounded-xl p-3" value={notes[item.id]||""} onChange={event=>setNotes(prev=>({...prev,[item.id]:event.target.value}))}/>
     </label>
     <div className="flex flex-wrap gap-3 mt-4">
      <button type="button" disabled={busy || (notes[item.id]||"").trim().length < 20} className="gth-btn-gold" onClick={()=>void review(item.id,"claim","approved")}>Approve evidence</button>
      <button type="button" disabled={busy} className="gth-btn" onClick={()=>void review(item.id,"claim","rejected")}>Reject</button>
     </div>
    </article>)}</div>
    <h2 className="text-xl font-bold mt-10">Private image evidence — {queue.media.length} pending</h2>
    <div className="grid gap-4 mt-4">{queue.media.map(item=><article key={item.id} className="gth-glass rounded-2xl p-5">
     <h3 className="font-bold">Project #{item.project_id} · {item.media_type}</h3>
     <p className="mt-2 text-sm break-words">Creator: {item.supplier} · License: {item.license_basis} · Attribution: {item.attribution||"Not provided"}</p>
     <p className="mt-2 text-sm break-words">Permission evidence: {item.permission_reference}</p>
     {item.original_url && <p className="mt-2 text-sm break-all">Source: {item.original_url}</p>}
     <p className="text-xs mt-2 opacity-60">Submitted {new Date(item.created_at).toLocaleString()}</p>
     <button type="button" disabled={busy} className="underline mt-3 text-sm" onClick={()=>void preview(item.id)}>View private image for 60 seconds</button>
     <label className="grid gap-2 mt-4 text-sm">Independent verification notes (20+ characters required for approval)
      <textarea rows={2} maxLength={1000} className="gth-glass rounded-xl p-3" value={notes[item.id]||""} onChange={event=>setNotes(prev=>({...prev,[item.id]:event.target.value}))}/>
     </label>
     <div className="flex flex-wrap gap-3 mt-4">
      <button type="button" disabled={busy || (notes[item.id]||"").trim().length < 20} className="gth-btn-gold" onClick={()=>void review(item.id,"media","approved")}>Approve rights review</button>
      <button type="button" disabled={busy} className="gth-btn" onClick={()=>void review(item.id,"media","rejected")}>Reject</button>
     </div>
    </article>)}</div>
   </>}
   {notice && <p className="mt-6" role="status">{notice}</p>}
   {error && <p className="mt-6" role="alert">{error}</p>}
  </div>
  {login && <LoginModal onClose={()=>setLogin(false)}/>}
 </main>;
}
