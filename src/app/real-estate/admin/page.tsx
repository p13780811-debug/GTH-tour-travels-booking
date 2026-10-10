"use client"
import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { readApiJson } from "@/lib/api-response"
export default function ReviewPage(){
 const [items,setItems]=useState<any[]>([]);const [message,setMessage]=useState("");const [busy,setBusy]=useState(false)
 async function request(method="GET",body?:unknown){const {data}=await supabase.auth.getSession();if(!data.session)throw new Error("Sign in with an administrator account.");return readApiJson(await fetch("/api/admin/submissions",{method,headers:{Authorization:`Bearer ${data.session.access_token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})}))}
 async function load(){setBusy(true);try{const rows=await request();if(!Array.isArray(rows))throw new Error("Invalid review response");setItems(rows);setMessage(rows.length?"":"No submissions awaiting review.")}catch(e){setMessage(e instanceof Error?e.message:"Queue unavailable")}finally{setBusy(false)}}
 useEffect(()=>{load()},[])
 return <main className="gth-container py-24 px-4"><h1 className="gth-title">Listing review</h1><p className="gth-sub">Approval publishes the recorded details. It does not mark the property verified or approve media.</p><button className="gth-btn my-4" disabled={busy} onClick={load}>Refresh queue</button>{message&&<p role="status">{message}</p>}<div className="grid gap-4">{items.map(item=><article key={item.id} className="gth-glass rounded-2xl p-5"><h2 className="gold-text">{item.title}</h2><p>{item.city}, {item.country} — {item.location}</p><p>{item.property_type} · {item.listing_type}</p><p className="whitespace-pre-wrap my-3">{item.description}</p>{['approved','rejected'].map(decision=><button key={decision} className="gth-btn mr-3" disabled={busy} onClick={async()=>{setBusy(true);try{await request("POST",{id:item.id,decision});await load()}catch(e){setMessage(e instanceof Error?e.message:"Review failed")}finally{setBusy(false)}}}>{decision==='approved'?'Approve & publish':'Reject'}</button>)}</article>)}</div></main>
}
