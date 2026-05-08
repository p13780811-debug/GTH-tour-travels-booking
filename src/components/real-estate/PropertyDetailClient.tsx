"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import styles from "@/app/real-estate/RealEstate.module.css"

import {
    MapPin,
    Sparkles,
    ShieldCheck,
    BadgeCheck,
    BrainCircuit,
    Star,
    ArrowUpRight,
    ScanSearch,
    Building2,
    Globe2,
    X,
} from "lucide-react"

import MapWrapper from "@/components/MapWrapper"
import AIChat from "@/components/AIChat"

type Property = {
    id: number
    title: string
    location: string
    price: number
    image: string
    description?: string
    lat?: number
    lng?: number
    is_featured?: boolean
}

export default function PropertyDetailClient({ slug }: { slug: string }) {

    const [property, setProperty] = useState<Property | null>(null)
    const [showAI, setShowAI] = useState(false)

    /* ========================= */
    /* VIEW HISTORY */
    /* ========================= */

    useEffect(() => {

        if (!property?.id) return

        const saved = JSON.parse(
            localStorage.getItem("viewed_props") || "[]"
        )

        const updated = [
            property.id,
            ...saved.filter((x: any) => x !== property.id),
        ].slice(0, 10)

        localStorage.setItem(
            "viewed_props",
            JSON.stringify(updated)
        )

    }, [property])

    /* ========================= */
    /* LOAD PROPERTY */
    /* ========================= */

    useEffect(() => {

        const fetchProperty = async () => {

            const { data } = await supabase
                .from("properties")
                .select("*")
                .eq("slug", slug)
                .single()

            setProperty(data)
        }

        fetchProperty()

    }, [slug])

    /* ========================= */
    /* LOADING */
    /* ========================= */

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">

                <div className="gth-glass px-8 py-6 rounded-[28px] flex items-center gap-4">

                    <div className="h-10 w-10 rounded-2xl border-2 border-[var(--gold)] border-t-transparent animate-spin" />

                    <div>
                        <p className="font-black text-lg">
                            Loading Property
                        </p>

                        <p className="text-sm opacity-60">
                            Initializing AI estate engine...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${styles.mainContainer} relative overflow-hidden`}>

            {/* ========================= */}
            {/* BACKGROUND GLOW */}
            {/* ========================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute top-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-[-140px] left-[-120px] h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            {/* ========================= */}
            {/* HERO */}
            {/* ========================= */}

            <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                    {/* ========================= */}
                    {/* LEFT SIDE */}
                    {/* ========================= */}

                    <div className="xl:col-span-3 space-y-6">

                        {/* IMAGE */}
                        <div className="gth-glass rounded-[34px] overflow-hidden relative group">

                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />

                            <img
                                src={property.image}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-[280px] md:h-[620px] object-cover transition duration-700 group-hover:scale-105"
                            />

                            {/* FEATURED */}
                            {property.is_featured && (
                                <div className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(212,175,55,0.35)] flex items-center gap-2">
                                    <Star size={14} />
                                    Featured Property
                                </div>
                            )}

                            {/* LIVE AI */}
                            <div className="absolute top-5 right-5 z-20 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <BrainCircuit size={14} className="text-cyan-400" />
                                AI Verified
                            </div>

                            {/* TITLE */}
                            <div className="absolute bottom-0 left-0 z-20 p-6 md:p-8 w-full">

                                <div className="flex flex-wrap items-center gap-3 mb-4">

                                    <div className="px-4 py-2 rounded-full border border-white/10 bg-white/10 backdrop-blur-xl text-[11px] uppercase tracking-[0.2em] font-black">
                                        Luxury Estate
                                    </div>

                                    <div className="px-4 py-2 rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 text-[11px] uppercase tracking-[0.2em] font-black text-[var(--gold)]">
                                        Premium Listing
                                    </div>
                                </div>

                                <h1 className="text-3xl md:text-6xl font-black leading-none tracking-[-0.05em] text-white max-w-4xl">
                                    {property.title}
                                </h1>

                                <div className="flex items-center gap-2 mt-5 text-white/80">
                                    <MapPin size={18} />
                                    <span className="text-sm md:text-base">
                                        {property.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="gth-glass rounded-[34px] p-6 md:p-8">

                            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">

                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 font-black mb-2">
                                        Estate Intelligence
                                    </p>

                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight">
                                        Property Overview
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04]">
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                    <span className="text-xs uppercase tracking-[0.2em] font-black">
                                        Secure Listing
                                    </span>
                                </div>
                            </div>

                            <p className="leading-8 text-[15px] opacity-80">
                                {property.description ||
                                    "This premium property is curated by the GTH Pro AI Real Estate Engine for luxury buyers seeking verified opportunities, high-value investment zones, and future-ready infrastructure."}
                            </p>

                            {/* FEATURES */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">

                                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                                    <Building2 size={20} className="mb-3 text-[var(--gold)]" />
                                    <h3 className="font-black mb-1">
                                        Smart Infrastructure
                                    </h3>
                                    <p className="text-sm opacity-60">
                                        AI curated future growth area
                                    </p>
                                </div>

                                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                                    <BadgeCheck size={20} className="mb-3 text-cyan-400" />
                                    <h3 className="font-black mb-1">
                                        Verified Listing
                                    </h3>
                                    <p className="text-sm opacity-60">
                                        Fraud & duplication scanned
                                    </p>
                                </div>

                                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                                    <Globe2 size={20} className="mb-3 text-emerald-400" />
                                    <h3 className="font-black mb-1">
                                        Premium Reach
                                    </h3>
                                    <p className="text-sm opacity-60">
                                        Optimized for serious buyers
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* MAP */}
                        <div className="gth-glass rounded-[34px] overflow-hidden">

                            <div className="flex items-center justify-between p-6 border-b border-white/10">

                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 font-black mb-2">
                                        Geo Intelligence
                                    </p>

                                    <h2 className="text-2xl font-black">
                                        Live Property Location
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.2em] font-black">
                                    <ScanSearch size={14} />
                                    Satellite Ready
                                </div>
                            </div>

                            <div className="h-[320px] md:h-[520px]">
                                <MapWrapper
                                    data={[property]}
                                    active={{
                                        id: property.id,
                                        coords: [property.lat, property.lng],
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ========================= */}
                    {/* RIGHT PANEL */}
                    {/* ========================= */}

                    <div className="xl:col-span-2 space-y-6">

                        {/* PRICE CARD */}
                        <div className="gth-glass rounded-[34px] p-6 md:p-8 sticky top-24">

                            {/* TOP */}
                            <div className="flex items-start justify-between gap-4 mb-6">

                                <div>

                                    <p className="text-[11px] uppercase tracking-[0.3em] opacity-60 font-black mb-2">
                                        Investment Value
                                    </p>

                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight gold-text">
                                        ₹ {property.price} L
                                    </h2>
                                </div>

                                <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                    <Sparkles size={22} />
                                </div>
                            </div>

                            {/* LOCATION */}
                            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 flex items-center gap-4 mb-6">

                                <div className="h-12 w-12 rounded-2xl bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                                    <MapPin size={20} />
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-black mb-1">
                                        Prime Location
                                    </p>

                                    <h3 className="font-black text-lg">
                                        {property.location}
                                    </h3>
                                </div>
                            </div>

                            {/* AI BUTTON */}
                            <button
                                onClick={() => setShowAI(true)}
                                className="group relative overflow-hidden w-full rounded-[24px] py-5 px-6 font-black uppercase tracking-[0.2em] text-black bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(212,175,55,0.25)]"
                            >

                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/20" />

                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    <Sparkles size={18} />
                                    Ask AI About This Property
                                    <ArrowUpRight size={18} />
                                </div>
                            </button>

                            {/* TRUST */}
                            <div className="mt-6 space-y-4">

                                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 flex items-start gap-4">

                                    <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                        <BrainCircuit size={18} />
                                    </div>

                                    <div>
                                        <h4 className="font-black mb-1">
                                            AI Deal Analysis
                                        </h4>

                                        <p className="text-sm opacity-60 leading-6">
                                            Smart valuation, area growth prediction, risk detection & negotiation suggestions.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 flex items-start gap-4">

                                    <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                        <ShieldCheck size={18} />
                                    </div>

                                    <div>
                                        <h4 className="font-black mb-1">
                                            Fraud Detection Layer
                                        </h4>

                                        <p className="text-sm opacity-60 leading-6">
                                            AI cross-checks pricing anomalies, suspicious listings & duplicate scams.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================= */}
            {/* AI MODAL */}
            {/* ========================= */}

            {showAI && (

                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-6">

                    <div className="relative w-full md:max-w-2xl h-[92vh] md:h-[88vh] rounded-t-[34px] md:rounded-[34px] overflow-hidden border border-white/10 bg-[var(--card)] shadow-[0_25px_80px_rgba(0,0,0,0.5)]">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">

                            <div className="flex items-center gap-3">

                                <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black">
                                    <Sparkles size={18} />
                                </div>

                                <div>
                                    <h3 className="font-black text-lg">
                                        GTH AI Property Assistant
                                    </h3>

                                    <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-black">
                                        Live Real Estate Intelligence
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAI(false)}
                                className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* CHAT */}
                        <div className="h-[calc(100%-76px)]">
                            <AIChat
                                context={`Property: ${property.title}, Location: ${property.location}, Price: ${property.price}`}
                                onClose={() => setShowAI(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================= */}
            {/* MOBILE STICKY CTA */}
            {/* ========================= */}

            <div className="fixed bottom-0 left-0 w-full md:hidden z-50 p-3 backdrop-blur-2xl border-t border-white/10 bg-[var(--card)]/90">

                <div className="flex items-center gap-3">

                    <div className="flex-1">

                        <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-black mb-1">
                            Premium Value
                        </p>

                        <h3 className="text-2xl font-black gold-text">
                            ₹ {property.price} L
                        </h3>
                    </div>

                    <button
                        onClick={() => setShowAI(true)}
                        className="shrink-0 px-5 py-4 rounded-[20px] font-black uppercase tracking-[0.15em] text-black bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] shadow-[0_0_25px_rgba(212,175,55,0.25)] active:scale-95 transition-all duration-300 flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        Ask AI
                    </button>
                </div>
            </div>
        </div>
    )
}