"use client"
import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { readApiJson } from "@/lib/api-response"
import LoginModal from "@/components/real-estate/auth/LoginModal"
export default function PostPropertyPage(){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [login,setLogin]=useState(false)
 return <main className="gth-container px-4 py-24"><section className="gth-glass rounded-3xl p-6 max-w-3xl mx-auto"><h1 className="gth-title">Submit a listing for review</h1><p className="gth-sub my-4">Submission does not publish a listing. An administrator reviews the details first. Prices and photos can be added only through a supported, reviewed workflow.</p>
 <form className="grid gap-4" onSubmit={async event=>{event.preventDefault();if(busy)return;const form=event.currentTarget;setBusy(true);setMessage("");try{const {data}=await supabase.auth.getSession();if(!data.session){setLogin(true);setMessage("Sign in before submitting.");return}await readApiJson(await fetch("/api/real-estate/submissions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(Object.fromEntries(new FormData(form)))}));setMessage("Submission received for review. It is not published yet.");form.reset()}catch(error){setMessage(error instanceof Error?error.message:"Submission failed")}finally{setBusy(false)}}}>
 {[['title','Title',3,180],['country','Country',2,80],['city','City',2,80],['location','Location',2,250]].map(([key,label,min,max])=><label key={String(key)}>{label}<input name={String(key)} required minLength={Number(min)} maxLength={Number(max)} className="gth-glass rounded-xl p-3 w-full"/></label>)}
 <label>Description<textarea name="description" required minLength={20} maxLength={5000} rows={5} className="gth-glass rounded-xl p-3 w-full"/></label>
 <label>Property type<select name="property_type" className="gth-glass bg-[var(--card)] p-3 w-full">{['Apartment','Villa','Penthouse','Commercial','Plot'].map(type=><option key={type}>{type}</option>)}</select></label>
 <label>Purpose<select name="listing_type" className="gth-glass bg-[var(--card)] p-3 w-full"><option value="buy">For sale</option><option value="rent">For rent</option></select></label>
 <button disabled={busy} className="gth-btn-gold">{busy?"Submitting…":"Submit for review"}</button>
 </form>{message&&<p className="mt-4" role="status">{message}</p>}<Link className="gth-btn inline-block mt-4" href="/real-estate">Browse listings</Link></section>{login&&<LoginModal onClose={()=>setLogin(false)}/>}</main>
}
