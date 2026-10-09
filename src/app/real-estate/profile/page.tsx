"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import LoginModal from "@/components/real-estate/auth/LoginModal"

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [login, setLogin] = useState(false)
    const [error, setError] = useState("")
    useEffect(() => {
        let mounted = true
        supabase.auth.getUser().then(({ data }) => {
            if (mounted) { setUser(data.user); setLoading(false) }
        }).catch(() => { if (mounted) { setError("Account could not be loaded."); setLoading(false) } })
        const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setUser(session?.user ?? null) })
        return () => { mounted = false; data.subscription.unsubscribe() }
    }, [])
    return <main className="gth-container min-h-screen py-24 px-4">
        <section className="gth-glass rounded-3xl p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold gold-text">Your account</h1>
            {loading ? <p role="status">Loading account…</p> : user ? <>
                <p className="mt-4">{user.email}</p>
                <p className="gth-sub mt-2">Listing publication and paid promotion require an approved owner workflow.</p>
                <button className="gth-btn mt-6" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setError("Sign out failed. Please retry.") }}>Sign out</button>
            </> : <button className="gth-btn-gold mt-6" onClick={() => setLogin(true)}>Sign in</button>}
            {error && <p role="alert">{error}</p>}
            <Link className="gth-btn mt-6 inline-block" href="/real-estate">Browse properties</Link>
        </section>
        {login && <LoginModal onClose={() => setLogin(false)} />}
    </main>
}
