"use client"

import { useState } from "react"
import Link from "next/link"
import JourneyNav from "@/components/real-estate/JourneyNav"
import { supabase } from "@/lib/supabase"
import { readApiJson } from "@/lib/api-response"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Listing.module.css"

const fields = [
    { key:"title", label:"Project or property name", min:3, max:180, hint:"Use the actual name shown in the property documents." },
    { key:"country", label:"Country", min:2, max:80, hint:"Country where the property is located." },
    { key:"city", label:"City", min:2, max:80, hint:"Use the recorded city name." },
    { key:"location", label:"Address or locality", min:2, max:250, hint:"Provide enough detail to identify the location accurately." },
]

export default function PostPropertyPage() {
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [login, setLogin] = useState(false)
    const [description, setDescription] = useState("")
    return <main className="gth-container pt-10 pb-28 px-4">
        <JourneyNav />
        <div className="max-w-3xl mx-auto mt-8"><header><p className="gold-text text-xs uppercase tracking-widest">GTH PRO / Listing submission</p><h1 className="text-3xl md:text-4xl font-bold mt-3">Introduce your property</h1><p className="opacity-70 leading-7 mt-4">Provide accurate details for administrator review. Submitting this form does not publish or verify the listing.</p></header>
        <section className="gth-glass rounded-3xl p-6 mt-6"><h2 className="font-bold">Before you start</h2><p className="opacity-70 leading-7 mt-3">All fields are required. Use details you can substantiate. This form currently accepts project basics; pricing and media are not collected here.</p><button className={`gth-btn ${styles.action} mt-4`} onClick={() => setLogin(true)}>Sign in with email</button></section>
        <form className="gth-glass rounded-3xl p-6 md:p-8 mt-6" onSubmit={async event => {
            event.preventDefault(); if (busy) return
            const form = event.currentTarget
            const payload = Object.fromEntries(new FormData(form))
            setBusy(true); setMessage(""); setError("")
            try {
                const {data} = await supabase.auth.getSession()
                if (!data.session) { setLogin(true); setError("Sign in, then submit your listing. Your current form remains open."); return }
                await readApiJson(await fetch("/api/real-estate/submissions", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session.access_token}`}, body:JSON.stringify(payload) }))
                setMessage("Submission received for review. It is not published yet. You can follow its status in Your account."); form.reset(); setDescription("")
            } catch (failure) { setError(failure instanceof Error ? failure.message : "Submission failed. Your entries have been kept.") }
            finally { setBusy(false) }
        }}>
            <fieldset disabled={busy} className="grid gap-5"><legend className="font-bold text-xl mb-5">Property details</legend>
                {fields.map(field => <div key={field.key}><label htmlFor={`listing-${field.key}`} className="block font-medium mb-2">{field.label}</label><input id={`listing-${field.key}`} name={field.key} required minLength={field.min} maxLength={field.max} aria-describedby={`listing-${field.key}-help`} className="gth-glass rounded-xl p-3 w-full" /><p id={`listing-${field.key}-help`} className="opacity-70 text-sm mt-2">{field.hint}</p></div>)}
                <div><label htmlFor="listing-description" className="block font-medium mb-2">Property description</label><textarea id="listing-description" name="description" required minLength={20} maxLength={5000} rows={6} value={description} onChange={event => setDescription(event.target.value)} aria-describedby="listing-description-help" className="gth-glass rounded-xl p-3 w-full" /><p id="listing-description-help" className="opacity-70 text-sm mt-2">Describe recorded facts without unsupported guarantees. {description.length}/5000 characters; minimum 20.</p></div>
                <div className="grid sm:grid-cols-2 gap-5"><label>Property type<select name="property_type" className="gth-glass bg-[var(--card)] rounded-xl p-3 w-full mt-2">{["Apartment","Villa","Penthouse","Commercial","Plot"].map(type => <option key={type}>{type}</option>)}</select></label><label>Listing purpose<select name="listing_type" className="gth-glass bg-[var(--card)] rounded-xl p-3 w-full mt-2"><option value="buy">For sale</option><option value="rent">For rent</option></select></label></div>
                <button className={`gth-btn-gold ${styles.action} justify-self-start`} type="submit">{busy ? "Submitting…" : "Submit for review"}</button>
            </fieldset>
            {message && <div className="mt-6" role="status"><p>{message}</p><Link href="/real-estate/profile" className="underline inline-block mt-3">View submission status</Link></div>}
            {error && <p className="mt-6" role="alert">{error}</p>}
        </form></div>
        {login && <LoginModal onClose={() => setLogin(false)} />}
        <BottomNav />
    </main>
}
