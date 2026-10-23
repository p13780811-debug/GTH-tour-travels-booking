"use client";
import Link from "next/link";
import {useState} from "react";
import {supabase} from "@/lib/supabase";
import {ArrowRight, BarChart3, RefreshCw, ShieldCheck, Users} from "lucide-react";
type Count={resource:string;count:number|null;accessible:boolean};
type Overview={counts:Count[];services:Record<string,boolean>;note:string;generated_at:string};
type Application={id:string;application_type:string;contact_name:string;contact_email:string;
  organisation:string|null;country:string|null;website:string|null;project_url:string|null;
  message:string;status:string;submitted_at:string};
export default function OperationsDashboard(){
  const [email,setEmail]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [applications,setApplications]=useState<Application[]>([]);
  async function authToken(){
    const {data,error}=await supabase.auth.getSession();
    if(error||!data.session?.access_token)throw new Error("Sign in to your Supabase administrator account first.");
    return data.session.access_token;
  }
  async function refresh(){
    setBusy(true);setMsg("");
    try{
      const token=await authToken();
      const headers={Authorization:`Bearer ${token}`};
      const [a,b]=await Promise.all([
        fetch("/api/admin/overview",{headers,cache:"no-store"}),
        fetch("/api/admin/partners",{headers,cache:"no-store"})
      ]);
      const [counts,queue]=await Promise.all([a.json(),b.json()]);
      if(!a.ok||!b.ok)throw new Error(counts.error||queue.error||"Admin data unavailable");
      setOverview(counts);setApplications(queue.items||[]);
      setMsg("Private dashboard refreshed. Figures reflect readable data; unavailable counts are not zero.");
    }catch(e){setMsg(e instanceof Error?e.message:"Dashboard unavailable");}
    finally{setBusy(false);}
  }
  async function update(id:string,status:"reviewing"|"closed"){
    setBusy(true);setMsg("");
    try{
      const token=await authToken();
      const r=await fetch("/api/admin/partners",{
        method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({id,status})
      });
      const body=await r.json();
      if(!r.ok)throw new Error(body.error||"Review update unavailable");
      setApplications(prev=>prev.map(row=>row.id===id?{...row,status}:row));
      setMsg("Review status updated. Nothing was publicly published.");
    }catch(e){setMsg(e instanceof Error?e.message:"Update unavailable");}
    finally{setBusy(false);}
  }
  async function signIn(){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setMsg("Enter a valid email address.");return;}
    setBusy(true);setMsg("");
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),
        options:{emailRedirectTo:window.location.origin+"/admin/operations"}});
      if(error)throw error;
      setMsg("Check your email for a sign-in link. Administrator authorisation is still required.");
    }catch{setMsg("Unable to request sign-in at this time.");}
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]"><ShieldCheck size={17}/> Restricted administration</p>
      <h1 className="mt-4 text-3xl font-semibold md:text-4xl">GTH PRO · Operations Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Review partner enquiries, listing queue indicators and configuration status. This dashboard does not expose keys, change supplier agreements or publish unverified inventory.</p>
      <Link href="/admin/tender-services" className="gth-btn mt-5 inline-flex items-center justify-center">Tender service enquiries & quote workflow</Link>
      <div className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <label className="text-xs font-semibold text-[var(--text-soft)]">Admin account email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@your-domain.com"
            className="mt-2 block min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)]"/>
        </label>
        <button disabled={busy} type="button" onClick={signIn} className="min-h-11 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-50">Email sign-in</button>
        <button disabled={busy} type="button" onClick={refresh} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50">
          <RefreshCw size={16}/>{busy?"Loading...":"Load operations"}</button>
      </div>
      {msg&&<p role="status" className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm leading-6">{msg}</p>}
      {overview&&<section className="mt-9">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 size={19}/> Operational indicators</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {overview.counts.map(c=><div key={c.resource} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--text-soft)]">{c.resource.replaceAll("_"," ")}</p>
            <p className="mt-2 text-3xl font-semibold">{c.accessible?c.count:"Unavailable"}</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">{c.accessible?"Current readable count":"Access/policy check required"}</p>
          </div>)}
        </div>
        <h3 className="mt-8 text-lg font-semibold">Configured services</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Object.entries(overview.services).map(([name,on])=><div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm" key={name}>
            <span>{name.replaceAll("_"," ")}</span><span className="text-xs text-[var(--text-soft)]">{on?"Configured":"Not configured"}</span>
          </div>)}
        </div>
        <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">{overview.note}</p>
      </section>}
      {overview&&<section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Users size={19}/> Partner application review</h2>
        <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Private business contact information—access restricted to authorised administrators. Do not disclose outside approved workflows.</p>
        {applications.length?<div className="mt-5 space-y-3">
          {applications.map(item=><article key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">{item.organisation||item.contact_name}</h3>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{item.application_type} · {item.status}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{item.contact_name} · {item.contact_email} · {item.country||"Country not supplied"}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-soft)]">{item.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status!=="reviewing"&&<button disabled={busy} onClick={()=>update(item.id,"reviewing")} className="min-h-10 rounded-lg border border-[var(--border)] px-4 text-xs font-semibold">Mark reviewing</button>}
              {item.status!=="closed"&&<button disabled={busy} onClick={()=>update(item.id,"closed")} className="min-h-10 rounded-lg border border-[var(--border)] px-4 text-xs font-semibold">Close review</button>}
            </div>
          </article>)}
        </div>:<p className="mt-5 rounded-2xl border border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">No partner applications in the current review queue.</p>}
      </section>}
    </div>
  </main>;
}
