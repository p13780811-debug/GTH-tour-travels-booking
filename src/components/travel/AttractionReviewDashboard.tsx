"use client";
import {useEffect,useState} from "react";
import type {Session} from "@supabase/supabase-js";
import {supabase} from "@/lib/supabase";
import {CheckCircle2,ExternalLink} from "lucide-react";
type Entry={wikidata_qid:string;name:string;description:string|null;category:string;region_slug:string;latitude:number;longitude:number;
 wikidata_url:string;image_url:string|null;commons_page:string|null;image_author:string|null;image_license:string|null};
export default function AttractionReviewDashboard(){
 const [session,setSession]=useState<Session|null>(null),[rows,setRows]=useState<Entry[]>([]);
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [check,setCheck]=useState<Record<string,boolean>>({}),[page,setPage]=useState(1);
 useEffect(()=>{let active=true;void supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session);});
 const {data}=supabase.auth.onAuthStateChange((_e,next)=>setSession(next));return()=>{active=false;data.subscription.unsubscribe();};},[]);
 useEffect(()=>{if(!session){setRows([]);return;}let live=true;
 void fetch("/api/admin/attractions?page="+page,{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"})
  .then(async r=>{if(!r.ok)throw Error(r.status===403?"Verified administrator role required":"Review queue unavailable");return r.json();})
  .then(data=>{if(live)setRows(data.items||[]);}).catch(e=>{if(live)setError(e.message);});
 return()=>{live=false;};},[session,page,message]);
 async function approve(item:Entry){
  if(!session||busy||!check[item.wikidata_qid])return;setBusy(true);setError("");
  try{const r=await fetch("/api/admin/attractions",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},
   body:JSON.stringify({wikidata_qid:item.wikidata_qid,action:"approve",source_verified:true})});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Review failed");
   setMessage("Published source record "+item.wikidata_qid);
  }catch(e){setError(e instanceof Error?e.message:"Review unavailable");}finally{setBusy(false);}
 }
 if(!session)return <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm">Sign in with your provisioned GTH PRO administrator account to review private attraction records.</p>;
 return <div className="space-y-4">
  <p className="text-sm text-[var(--text-soft)]">Authenticated as {session.user.email}. Public users cannot view this review queue.</p>
  {rows.map(item=><section key={item.wikidata_qid} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
   <h2 className="text-lg font-semibold">{item.name}</h2>
   <p className="mt-1 text-xs text-[var(--text-soft)]">{item.region_slug} · {item.category} · {item.latitude}, {item.longitude}</p>
   <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{item.description||"No source description; verify Wikidata identity."}</p>
   <a href={item.wikidata_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-2 text-sm underline">Inspect Wikidata source <ExternalLink size={15}/></a>
   {item.commons_page&&<p className="mt-2 text-xs">Source photo: <a href={item.commons_page} target="_blank" rel="noopener noreferrer nofollow" className="underline">{item.image_author} · {item.image_license}</a></p>}
   <label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={check[item.wikidata_qid]||false} onChange={e=>setCheck(current=>({...current,[item.wikidata_qid]:e.target.checked}))}/>
   I independently checked the place name/category, location and all photo publication rights.</label>
   <button type="button" disabled={busy||!check[item.wikidata_qid]} onClick={()=>void approve(item)}
    className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm disabled:opacity-50"><CheckCircle2 size={16}/> Approve source listing</button>
  </section>)}
  {!rows.length&&!error&&<p className="text-sm text-[var(--text-soft)]">No pending records here yet, or importer has not completed.</p>}
  <div className="flex gap-3"><button type="button" disabled={page<2} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Previous</button>
  <span className="pt-2 text-sm">Page {page}</span><button type="button" onClick={()=>setPage(p=>Math.min(20,p+1))} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Next</button></div>
  {message&&<p role="status" className="text-sm">{message}</p>}{error&&<p role="alert" className="text-sm">{error}</p>}
 </div>;
}