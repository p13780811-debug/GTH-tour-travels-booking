"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { readApiJson } from "@/lib/api-response"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import styles from "@/components/real-estate/Listing.module.css"

type Submission = { id:string; title:string; country:string; city:string; location:string; description:string; property_type:string; listing_type:string; created_at:string }
type Decision = { id:string; title:string; value:"approved" | "rejected" }

export default function ReviewPage() {
    const [user, setUser] = useState<User | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [login, setLogin] = useState(false)
    const [items, setItems] = useState<Submission[]>([])
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [reviewing, setReviewing] = useState(false)
    const [decision, setDecision] = useState<Decision | null>(null)
    const generation = useRef(0)
    const isAdmin = user?.app_metadata?.role === "admin"

    const request = useCallback(async (body?: { id:string; decision:string }) => {
        const {data} = await supabase.auth.getSession()
        if (!data.session) throw new Error("Sign in with an administrator account.")
        return readApiJson(await fetch("/api/admin/submissions", { method:body ? "POST" : "GET", headers:{Authorization:`Bearer ${data.session.access_token}`, ...(body ? {"Content-Type":"application/json"} : {})}, ...(body ? {body:JSON.stringify(body)} : {}), cache:"no-store" }))
    }, [])
    const load = useCallback(async () => {
        const current = ++generation.current
        setLoading(true); setError("")
        try {
            const rows = await request()
            if (!Array.isArray(rows)) throw new Error("Review queue unavailable")
            if (current === generation.current) setItems(rows)
        } catch (failure) {
            if (current === generation.current) { setItems([]); setError(failure instanceof Error ? failure.message : "Review queue unavailable") }
        } finally { if (current === generation.current) setLoading(false) }
    }, [request])
    useEffect(() => {
        let active = true
        supabase.auth.getUser().then(({data}) => { if (active) { setUser(data.user); setAuthLoading(false) } }).catch(() => { if (active) { setError("Account could not be checked."); setAuthLoading(false) } })
        const {data} = supabase.auth.onAuthStateChange((_event, session) => { if (active) setUser(session?.user ?? null) })
        return () => { active = false; generation.current += 1; data.subscription.unsubscribe() }
    }, [])
    useEffect(() => {
        generation.current += 1
        setItems([]); setDecision(null); setMessage("")
        if (isAdmin) { setLogin(false); load() }
    }, [user?.id, isAdmin, load])

    const confirmReview = async () => {
        if (!decision || reviewing) return
        const chosen = decision
        setReviewing(true); setError(""); setMessage("")
        try {
            await request({id:chosen.id, decision:chosen.value})
            setDecision(null)
            setMessage(chosen.value === "approved" ? `Publication approved for ${chosen.title}. This does not verify the property or approve its media.` : `Submission rejected: ${chosen.title}. No listing was published by this decision.`)
            await load()
        } catch (failure) {
            setDecision(null)
            setError(`${failure instanceof Error ? failure.message : "Review response unavailable"}. Refresh the queue before making another decision.`)
        } finally { setReviewing(false) }
    }

    return <main className="gth-container min-h-screen pt-10 pb-20 px-4">
        <Link href="/real-estate" className="opacity-70">← Back to properties</Link>
        <header className="mt-8 mb-8"><p className="gold-text text-xs uppercase tracking-widest">GTH PRO / Administration</p><h1 className="text-3xl md:text-4xl font-bold mt-3">Listing review workspace</h1><p className="opacity-70 leading-7 mt-4 max-w-3xl">Check submitted details before publication. Approval does not verify property claims or authorize images.</p></header>
        {authLoading ? <p role="status">Checking administrator access…</p> : !user ? <section className="gth-glass rounded-3xl p-8"><h2 className="text-xl font-bold">Administrator sign-in required</h2><button className={`gth-btn-gold ${styles.action} mt-5`} onClick={() => setLogin(true)}>Sign in</button></section> : !isAdmin ? <section className="gth-glass rounded-3xl p-8"><h2 className="text-xl font-bold">Administrator access required</h2><p className="opacity-70 mt-3">This account cannot review or publish submissions.</p><Link href="/real-estate/profile" className={`gth-btn ${styles.action} mt-5`}>Your account</Link></section> : <>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6"><p>{loading ? "Loading review queue…" : `${items.length} pending submissions shown`}</p><button className={`gth-btn ${styles.action}`} disabled={loading || reviewing} onClick={() => { setDecision(null); load() }}>Refresh queue</button></div>
            <p className="text-sm opacity-70 mb-6">Up to 50 oldest pending submissions. Review is restricted by the server and database permissions.</p>
            {message && <p role="status" className="gth-glass rounded-2xl p-5 mb-5">{message}</p>}
            {!loading && !error && !items.length && <section className="gth-glass rounded-3xl p-8"><h2 className="text-xl font-bold">No submissions awaiting review</h2><p className="opacity-70 mt-3">Refresh when a new submission is received.</p></section>}
            <div className="space-y-5">{items.map(item => <article key={item.id} className="gth-glass rounded-3xl p-6 md:p-8"><header className="flex justify-between items-start gap-4 flex-wrap"><h2 className="text-2xl font-bold">{item.title}</h2><span className="gth-badge">Awaiting review</span></header><dl className="grid sm:grid-cols-2 gap-4 my-6">{[["Location",item.location],["City / Country",`${item.city}, ${item.country}`],["Property type",item.property_type],["Purpose",item.listing_type === "rent" ? "For rent" : "For sale"]].map(([label,value]) => <div key={label}><dt className="text-sm opacity-70">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><h3 className="font-bold">Submitted description</h3><p className="whitespace-pre-wrap leading-7 opacity-70 mt-3 break-words">{item.description}</p>
                {decision?.id === item.id ? <section className="gth-glass rounded-2xl p-5 mt-6" aria-labelledby={`decision-${item.id}`}><h3 id={`decision-${item.id}`} className="font-bold">{decision.value === "approved" ? "Publish this submission?" : "Reject this submission?"}</h3><p className="text-sm opacity-70 leading-6 mt-3">{decision.value === "approved" ? "This creates a public listing from these recorded details. It will remain unverified, without approved photos or pricing." : "The submission will leave the pending queue. This decision does not publish a listing."}</p><div className="flex gap-3 flex-wrap mt-4"><button className={`gth-btn-gold ${styles.action}`} disabled={reviewing} onClick={confirmReview}>{reviewing ? "Saving decision…" : decision.value === "approved" ? "Confirm publication" : "Confirm rejection"}</button><button className={`gth-btn ${styles.action}`} disabled={reviewing} onClick={() => setDecision(null)}>Cancel</button></div></section> : <div className="flex gap-3 flex-wrap mt-6"><button className={`gth-btn-gold ${styles.action}`} disabled={loading || reviewing} onClick={() => setDecision({id:item.id,title:item.title,value:"approved"})}>Review for publication</button><button className={`gth-btn ${styles.action}`} disabled={loading || reviewing} onClick={() => setDecision({id:item.id,title:item.title,value:"rejected"})}>Reject submission</button></div>}
            </article>)}</div>
        </>}
        {error && <p role="alert" className="mt-6">{error}</p>}
        {login && <LoginModal onClose={() => setLogin(false)} />}
    </main>
}
