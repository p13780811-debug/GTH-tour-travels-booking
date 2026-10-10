"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import JourneyNav from "@/components/real-estate/JourneyNav"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { readApiJson } from "@/lib/api-response"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Listing.module.css"

type Submission = { id:string; title:string; status:"review" | "approved" | "rejected"; created_at:string }

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [login, setLogin] = useState(false)
    const [error, setError] = useState("")
    const [history, setHistory] = useState<Submission[]>([])
    const [historyError, setHistoryError] = useState("")
    const [historyLoading, setHistoryLoading] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const request = useRef(0)

    const loadHistory = useCallback(async () => {
        const current = ++request.current
        setHistoryLoading(true); setHistoryError("")
        try {
            const { data } = await supabase.auth.getSession()
            if (!data.session) { if (current === request.current) setHistory([]); return }
            const rows = await readApiJson(await fetch("/api/real-estate/submissions", { headers:{ Authorization:`Bearer ${data.session.access_token}` }, cache:"no-store" }))
            if (!Array.isArray(rows)) throw new Error("Submission history unavailable")
            if (current === request.current) setHistory(rows)
        } catch { if (current === request.current) { setHistory([]); setHistoryError("Submission history could not be loaded. Please retry.") } }
        finally { if (current === request.current) setHistoryLoading(false) }
    }, [])

    useEffect(() => {
        let active = true
        supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setLoading(false) } }).catch(() => { if (active) { setError("Account could not be loaded."); setLoading(false) } })
        const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setUser(session?.user ?? null) })
        return () => { active = false; request.current += 1; data.subscription.unsubscribe() }
    }, [])
    useEffect(() => {
        request.current += 1
        setHistory([])
        if (user) { setLogin(false); loadHistory() }
    }, [user?.id, loadHistory])

    return <main className="gth-container min-h-screen pt-10 pb-28 px-4">
        <JourneyNav />
        <header className="mt-8 mb-8"><p className="gold-text text-xs uppercase tracking-widest">GTH PRO / Account</p><h1 className="text-3xl md:text-4xl font-bold mt-3">Your property workspace</h1><p className="opacity-70 mt-4">Manage your submissions and continue exploring listings.</p></header>
        {loading ? <p role="status">Loading account…</p> : <section className="gth-glass rounded-3xl p-6 flex justify-between gap-5 flex-wrap items-center">{user ? <><div><h2 className="font-bold">Signed in</h2><p className="opacity-70 mt-2 break-all">{user.email}</p></div><button disabled={signingOut} className={`gth-btn ${styles.action}`} onClick={async () => { setSigningOut(true); setError(""); try { const {error} = await supabase.auth.signOut(); if (error) throw error } catch { setError("Sign out failed. Please retry.") } finally { setSigningOut(false) } }}>{signingOut ? "Signing out…" : "Sign out"}</button></> : <><div><h2 className="font-bold">Sign in to view your submissions</h2><p className="opacity-70 mt-2">Device-saved listings remain available without an account.</p></div><button className={`gth-btn-gold ${styles.action}`} onClick={() => setLogin(true)}>Sign in</button></>}</section>}
        {error && <p role="alert" className="my-4">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-5 mt-6"><section className="gth-glass rounded-3xl p-6"><h2 className="text-xl font-bold">Saved & compare</h2><p className="opacity-70 leading-7 my-4">Review the listings saved on this device and compare available details.</p><Link className={`gth-btn ${styles.action}`} href="/real-estate/saved">Open saved listings</Link></section><section className="gth-glass rounded-3xl p-6"><h2 className="text-xl font-bold">Submit a property</h2><p className="opacity-70 leading-7 my-4">Send accurate details for review. Submission does not publish immediately.</p><Link className={`gth-btn-gold ${styles.action}`} href="/real-estate/post-property">Start a submission</Link></section></div>
        {user && <section className="gth-glass rounded-3xl p-6 md:p-8 mt-8"><div className="flex justify-between items-center gap-4"><h2 className="text-2xl font-bold">Your submissions</h2><button className={`gth-btn ${styles.action}`} disabled={historyLoading} onClick={loadHistory}>Refresh</button></div><p className="text-sm opacity-70 mt-3">Most recent 50 submissions. Approval is a publication decision, not a property verification.</p>{historyLoading ? <p role="status" className="mt-6">Loading submissions…</p> : historyError ? <p role="alert" className="mt-6">{historyError}</p> : history.length ? <ul className="mt-6 space-y-4">{history.map(item => <li className="gth-glass rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap" key={item.id}><div><h3 className="font-bold">{item.title}</h3><p className="text-sm opacity-70 mt-2">{new Date(item.created_at).toLocaleDateString()}</p></div><span className="gth-badge">{item.status === "review" ? "Awaiting review" : item.status === "approved" ? "Approved" : "Not approved"}</span></li>)}</ul> : <div className="mt-6"><p>No submissions yet.</p><p className="opacity-70 mt-2">Your listing review status will appear here after you submit.</p></div>}</section>}
        {login && <LoginModal onClose={() => setLogin(false)} />}
        <BottomNav user={user} />
    </main>
}
