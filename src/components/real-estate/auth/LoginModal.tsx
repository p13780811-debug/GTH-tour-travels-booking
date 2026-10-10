"use client"

import { useEffect, useRef, useState } from "react"
import { Mail, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import styles from "../Listing.module.css"

export default function LoginModal({ onClose }: { onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null)
    const [email, setEmail] = useState("")
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const element = dialog.current
        const previous = document.activeElement as HTMLElement | null
        const overflow = document.body.style.overflow
        element?.showModal()
        document.body.style.overflow = "hidden"
        return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus() }
    }, [])

    return <dialog ref={dialog} aria-labelledby="estate-signin-title" aria-describedby="estate-signin-description" className={styles.authDialog} onCancel={event => { event.preventDefault(); onClose() }}>
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-start gap-4"><div><Mail className="gold-text mb-4" size={28} aria-hidden="true" /><p className="gold-text text-xs uppercase tracking-widest">GTH PRO Real Estate</p><h2 id="estate-signin-title" className="text-2xl font-bold mt-3">Sign in to your account</h2></div><button type="button" className="gth-glass rounded-xl p-3" aria-label="Close sign-in" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
            <p id="estate-signin-description" className="opacity-70 leading-7 mt-4">Use your email to request a sign-in link. No password is needed for your GTH PRO account.</p>
            <form className="mt-6 space-y-4" onSubmit={async event => {
                event.preventDefault()
                if (busy) return
                const value = email.trim()
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) { setError("Enter a valid email address."); return }
                setBusy(true); setError(""); setMessage("")
                try {
                    const path = window.location.pathname.startsWith("/real-estate") ? window.location.pathname : "/real-estate/profile"
                    const { error } = await supabase.auth.signInWithOtp({ email:value, options:{ emailRedirectTo:`${window.location.origin}${path}` } })
                    if (error) throw error
                    setMessage("Sign-in link requested. Check your email and spam folder. Open the link to finish signing in.")
                } catch { setError("Unable to request a sign-in link. Please wait a moment and retry.") }
                finally { setBusy(false) }
            }}>
                <label htmlFor="estate-signin-email" className="block font-medium">Email address</label>
                <input id="estate-signin-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} aria-invalid={Boolean(error)} className="w-full gth-glass rounded-xl p-3" placeholder="you@example.com" />
                <button type="submit" disabled={busy} className={`gth-btn-gold ${styles.action} w-full`}>{busy ? "Requesting link…" : "Email me a sign-in link"}</button>
                {message && <p role="status" className="gth-glass rounded-xl p-4 text-sm leading-6">{message}</p>}
                {error && <p role="alert" className="text-sm">{error}</p>}
            </form>
            <p className="text-sm opacity-70 mt-6">You can browse listings and save them on this device without signing in. Submitting a listing requires an account.</p>
        </div>
    </dialog>
}
