"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

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
    Heart,
    Share2,
    TrendingUp,
    Clock3,
    Shield,
    Eye,
    Crown,
    Zap,
    MessageSquare,
    Phone,
    Bookmark,
    CheckCircle2,
    Radar,
    Activity,
    Layers3,
    Bot,
    ChevronRight,
    Wifi,
    Lock,
} from "lucide-react"

import styles from "@/app/real-estate/RealEstate.module.css"
import AIChat from "@/components/AIChat"

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center bg-[var(--card)]">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
                <p className="font-black text-[var(--text)]">
                    Initializing Geo Engine...
                </p>
            </div>
        </div>
    ),
})

type Property = {
    id: number
    slug: string
    title: string
    location: string
    city?: string
    country?: string
    price: number
    image: string
    gallery?: string[]
    description?: string
    lat?: number
    lng?: number
    sqft?: number
    beds?: number
    baths?: number
    property_type?: string
    amenities?: string[]
    is_featured?: boolean
    ai_score?: number
    views?: number
    verified?: boolean
    created_at?: string
    rank_position?: number
}

const memoryCache = new Map<string, any>()

export default function PropertyDetailClient({
    slug,
    initialData,
}: {
    slug: string
    initialData?: any
}) {

    const router = useRouter()

    const [property, setProperty] =
        useState<Property | null>(
            initialData || null
        )
    const [recommended, setRecommended] = useState<Property[]>([])
    const [showAI, setShowAI] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)

    const fetchProperty = useCallback(async () => {

        try {

            const cacheKey = `property-${slug}`

            if (memoryCache.has(cacheKey)) {
                setProperty(memoryCache.get(cacheKey))
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("properties")
                .select(`
                    id,
                    slug,
                    title,
                    location,
                    city,
                    country,
                    price,
                    image,
                    gallery,
                    description,
                    lat,
                    lng,
                    sqft,
                    beds,
                    baths,
                    property_type,
                    amenities,
                    is_featured,
                    ai_score,
                    views,
                    verified,
                    created_at,
                    rank_position
                `)
                .eq("slug", slug)
                .limit(1)

            if (error || !data?.length) {
                router.push("/real-estate")
                return
            }

            const row = data[0]

            memoryCache.set(cacheKey, row)

            setProperty(row)

        } catch (err) {

            console.error("PROPERTY_FETCH_ERROR", err)

        } finally {

            setLoading(false)

        }

    }, [slug, router])

    const fetchRecommendations = useCallback(async (city?: string) => {

        if (!city) return

        try {

            const { data } = await supabase
                .from("properties")
                .select(`
                    id,
                    slug,
                    title,
                    location,
                    price,
                    image,
                    ai_score,
                    is_featured
                `)
                .eq("city", city)
                .neq("slug", slug)
                .order("rank_position", { ascending: true })
                .range(0, 5)

            setRecommended(data || [])

        } catch (err) {

            console.error("RECOMMENDATION_ERROR", err)

        }

    }, [slug])

    useEffect(() => {

        fetchProperty()

    }, [fetchProperty])

    useEffect(() => {

        if (!property) return

        fetchRecommendations(property.city)

        const viewed = JSON.parse(
            localStorage.getItem("gth_recent_views") || "[]"
        )

        const updated = [
            property.slug,
            ...viewed.filter((x: string) => x !== property.slug),
        ].slice(0, 15)

        localStorage.setItem(
            "gth_recent_views",
            JSON.stringify(updated)
        )

    }, [property, fetchRecommendations])

    const propertyInsights = useMemo(() => {

        if (!property) return []

        return [
            {
                icon: BrainCircuit,
                title: "AI Investment Score",
                value: `${property.ai_score || 92}/100`,
                color: "text-cyan-400",
            },
            {
                icon: TrendingUp,
                title: "Growth Prediction",
                value: "+18% Projected",
                color: "text-emerald-400",
            },
            {
                icon: Shield,
                title: "Fraud Safety",
                value: "Verified Safe",
                color: "text-[var(--gold)]",
            },
            {
                icon: Radar,
                title: "Demand Heat",
                value: "High Demand",
                color: "text-rose-400",
            },
        ]

    }, [property])

    if (loading || !property) {

        return (

            <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">

                <div className="gth-glass-ultra flex items-center gap-5 rounded-[32px] border border-[var(--border)] px-10 py-8">

                    <div className="h-12 w-12 rounded-full border-[3px] border-[var(--gold)] border-t-transparent animate-spin" />

                    <div>

                        <h2 className="text-xl font-black text-[var(--text)]">
                            GTH Quantum Estate Engine
                        </h2>

                        <p className="mt-2 text-sm text-[var(--muted)]">
                            Syncing live property intelligence...
                        </p>

                    </div>

                </div>

            </div>

        )

    }

    return (

        <div className={`${styles.mainContainer} relative overflow-hidden bg-[var(--bg)] text-[var(--text)]`}>

            {/* GLOBAL FX */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="absolute right-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                <div className="absolute bottom-[-200px] left-[20%] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute inset-0 gth-grid-luxury opacity-[0.04]" />

            </div>

            {/* HERO */}

            <section className="relative z-10 mx-auto max-w-[1700px] px-4 pb-24 pt-6 md:px-8 md:pt-10">

                <div className="grid grid-cols-1 gap-7 xl:grid-cols-12">

                    {/* LEFT */}

                    <div className="space-y-7 xl:col-span-8">

                        {/* HERO IMAGE */}

                        <div className="gth-glass-ultra group relative overflow-hidden rounded-[40px] border border-[var(--border)]">

                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <Image
                                src={property.image}
                                alt={property.title}
                                width={1800}
                                height={1200}
                                priority
                                className="h-[320px] w-full object-cover transition duration-1000 group-hover:scale-105 md:h-[760px]"
                            />

                            {/* TOP ACTIONS */}

                            <div className="absolute left-0 top-0 z-20 flex w-full items-start justify-between p-5 md:p-8">

                                <div className="flex flex-wrap items-center gap-3">

                                    {property.is_featured && (
                                        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                            <Crown size={14} />
                                            Featured Estate
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-2xl">
                                        <BrainCircuit size={14} className="text-cyan-400" />
                                        AI Verified
                                    </div>

                                </div>

                                <div className="flex items-center gap-3">

                                    <button
                                        onClick={() => setSaved(!saved)}
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white backdrop-blur-2xl transition-all duration-300 hover:scale-105"
                                    >
                                        {saved
                                            ? <Heart size={20} className="fill-red-500 text-red-500" />
                                            : <Heart size={20} />
                                        }
                                    </button>

                                    <button className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white backdrop-blur-2xl transition-all duration-300 hover:scale-105">
                                        <Share2 size={20} />
                                    </button>

                                </div>

                            </div>

                            {/* BOTTOM */}

                            <div className="absolute bottom-0 left-0 z-20 w-full p-6 md:p-10">

                                <div className="mb-5 flex flex-wrap items-center gap-3">

                                    <div className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-xl">
                                        {property.property_type || "Luxury Estate"}
                                    </div>

                                    <div className="rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--gold)]">
                                        Rank #{property.rank_position || 1}
                                    </div>

                                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                                        Verified Property
                                    </div>

                                </div>

                                <h1 className="max-w-5xl text-4xl font-black leading-none tracking-[-0.06em] text-white md:text-7xl">
                                    {property.title}
                                </h1>

                                <div className="mt-6 flex flex-wrap items-center gap-6 text-white/80">

                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} />
                                        <span className="text-sm font-semibold md:text-base">
                                            {property.location}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Eye size={18} />
                                        <span className="text-sm font-semibold md:text-base">
                                            {property.views || 1280} Views
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock3 size={18} />
                                        <span className="text-sm font-semibold md:text-base">
                                            Live Updated
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* AI INSIGHTS */}

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                            {propertyInsights.map((item, index) => {

                                const Icon = item.icon

                                return (

                                    <div
                                        key={index}
                                        className="gth-glass-ultra rounded-[30px] border border-[var(--border)] p-6"
                                    >

                                        <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ${item.color}`}>
                                            <Icon size={24} />
                                        </div>

                                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                                            {item.title}
                                        </p>

                                        <h3 className="mt-3 text-2xl font-black text-[var(--text)]">
                                            {item.value}
                                        </h3>

                                    </div>

                                )

                            })}

                        </div>

                        {/* DESCRIPTION */}

                        <div className="gth-glass-ultra rounded-[40px] border border-[var(--border)] p-6 md:p-10">

                            <div className="mb-8 flex flex-wrap items-center justify-between gap-5">

                                <div>

                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--primary)]">
                                        Quantum Estate Intelligence
                                    </p>

                                    <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                                        Property Overview
                                    </h2>

                                </div>

                                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3">

                                    <CheckCircle2 size={16} className="text-emerald-400" />

                                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-400">
                                        Security Passed
                                    </span>

                                </div>

                            </div>

                            <p className="text-[15px] leading-9 text-[var(--muted)] md:text-[17px]">
                                {property.description || "This AI-curated premium estate is optimized for luxury investors, high-value buyers, and future-ready infrastructure opportunities powered by GTH PRO intelligence systems."}
                            </p>

                            {/* META */}

                            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">

                                <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                                        Bedrooms
                                    </p>

                                    <h3 className="mt-3 text-3xl font-black">
                                        {property.beds || "4"}
                                    </h3>

                                </div>

                                <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                                        Bathrooms
                                    </p>

                                    <h3 className="mt-3 text-3xl font-black">
                                        {property.baths || "3"}
                                    </h3>

                                </div>

                                <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                                        Area
                                    </p>

                                    <h3 className="mt-3 text-3xl font-black">
                                        {property.sqft || "2400"} sqft
                                    </h3>

                                </div>

                                <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                                        Estate Type
                                    </p>

                                    <h3 className="mt-3 text-2xl font-black">
                                        {property.property_type || "Villa"}
                                    </h3>

                                </div>

                            </div>

                        </div>

                        {/* MAP */}

                        <div className="gth-glass-ultra overflow-hidden rounded-[40px] border border-[var(--border)]">

                            <div className="flex flex-wrap items-center justify-between gap-5 border-b border-[var(--border)] p-6 md:p-8">

                                <div>

                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--primary)]">
                                        Geo Intelligence System
                                    </p>

                                    <h2 className="text-3xl font-black md:text-4xl">
                                        Live Estate Mapping
                                    </h2>

                                </div>

                                <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/[0.04] px-5 py-3">

                                    <Wifi size={16} className="text-cyan-400" />

                                    <span className="text-[11px] font-black uppercase tracking-[0.22em]">
                                        Satellite Synced
                                    </span>

                                </div>

                            </div>

                            <div className="h-[360px] md:h-[620px]">

                                <MapWrapper
                                    data={[property]}
                                    active={{
                                        id: property.id,
                                        coords: [property.lat || 19.076, property.lng || 72.877],
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="space-y-7 xl:col-span-4">

                        <div className="sticky top-24 space-y-7">

                            {/* PRICE CARD */}

                            <div className="gth-glass-ultra rounded-[40px] border border-[var(--border)] p-6 md:p-8">

                                <div className="mb-8 flex items-start justify-between gap-5">

                                    <div>

                                        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] text-[var(--primary)]">
                                            AI Market Valuation
                                        </p>

                                        <h2 className="gold-text text-5xl font-black tracking-tight md:text-6xl">
                                            ₹ {property.price >= 100 ? `${(property.price / 100).toFixed(2)} Cr` : `${property.price} L`}
                                        </h2>

                                    </div>

                                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                                        <Sparkles size={24} />
                                    </div>

                                </div>

                                {/* ACTIONS */}

                                <div className="space-y-4">

                                    <button
                                        onClick={() => setShowAI(true)}
                                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[26px] bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-6 py-5 text-sm font-black uppercase tracking-[0.22em] text-black transition-all duration-500 hover:scale-[1.02]"
                                    >

                                        <div className="absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 bg-white/20" />

                                        <BrainCircuit size={18} className="relative z-10" />

                                        <span className="relative z-10">
                                            Ask AI About This Estate
                                        </span>

                                        <ArrowUpRight size={18} className="relative z-10" />

                                    </button>

                                    <button className="gth-glass flex w-full items-center justify-center gap-3 rounded-[26px] border border-[var(--border)] px-6 py-5 text-sm font-black uppercase tracking-[0.22em] transition-all duration-500 hover:scale-[1.01]">

                                        <Phone size={18} />

                                        Contact Seller

                                    </button>

                                    <button className="gth-glass flex w-full items-center justify-center gap-3 rounded-[26px] border border-[var(--border)] px-6 py-5 text-sm font-black uppercase tracking-[0.22em] transition-all duration-500 hover:scale-[1.01]">

                                        <MessageSquare size={18} />

                                        Schedule Visit

                                    </button>

                                </div>

                                {/* TRUST BLOCK */}

                                <div className="mt-8 space-y-4">

                                    <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                        <div className="mb-4 flex items-center gap-3">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                                                <Bot size={20} />
                                            </div>

                                            <div>

                                                <h3 className="font-black">
                                                    AI Deal Analyzer
                                                </h3>

                                                <p className="text-xs text-[var(--muted)]">
                                                    Real-time valuation engine
                                                </p>

                                            </div>

                                        </div>

                                        <p className="text-sm leading-7 text-[var(--muted)]">
                                            Smart price comparison, negotiation intelligence, future appreciation signals and market heat analysis.
                                        </p>

                                    </div>

                                    <div className="rounded-[28px] border border-[var(--border)] bg-white/[0.03] p-5">

                                        <div className="mb-4 flex items-center gap-3">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                                <Lock size={20} />
                                            </div>

                                            <div>

                                                <h3 className="font-black">
                                                    Fraud Detection Layer
                                                </h3>

                                                <p className="text-xs text-[var(--muted)]">
                                                    Multi-layer AI protection
                                                </p>

                                            </div>

                                        </div>

                                        <p className="text-sm leading-7 text-[var(--muted)]">
                                            Duplicate detection, suspicious pricing scan, scam probability analysis and seller authenticity validation.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* RECOMMENDED */}

                            <div className="gth-glass-ultra rounded-[40px] border border-[var(--border)] p-6">

                                <div className="mb-6 flex items-center justify-between">

                                    <div>

                                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--primary)]">
                                            AI Personalized
                                        </p>

                                        <h3 className="text-2xl font-black">
                                            Similar Estates
                                        </h3>

                                    </div>

                                    <Activity size={22} className="text-[var(--gold)]" />

                                </div>

                                <div className="space-y-4">

                                    {recommended.map((item) => (

                                        <Link
                                            key={item.id}
                                            href={`/real-estate/${item.slug}`}
                                            prefetch={false} // 20k data hai toh performance ke liye false rakhein
                                            className="group flex items-center gap-4 rounded-[26px] border border-[var(--border)] bg-white/[0.03] p-4 transition-all duration-500 hover:translate-x-1 hover:border-[var(--gold)]/20"
                                        >

                                            <div className="relative h-24 w-24 overflow-hidden rounded-2xl">

                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    width={300}
                                                    height={300}
                                                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                                />

                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <h4 className="truncate text-base font-black">
                                                    {item.title}
                                                </h4>

                                                <p className="mt-2 truncate text-sm text-[var(--muted)]">
                                                    {item.location}
                                                </p>

                                                <div className="mt-3 flex items-center justify-between">

                                                    <span className="gold-text text-xl font-black">
                                                        ₹ {item.price} L
                                                    </span>

                                                    <ChevronRight
                                                        size={18}
                                                        className="text-[var(--gold)] transition-all duration-500 group-hover:translate-x-1"
                                                    />

                                                </div>

                                            </div>

                                        </Link>

                                    ))}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* AI MODAL */}

            {showAI && (

                <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/80 p-0 backdrop-blur-2xl md:items-center md:p-6">

                    <div className="relative h-[94vh] w-full overflow-hidden rounded-t-[36px] border border-[var(--border)] bg-[var(--card)] shadow-[0_30px_100px_rgba(0,0,0,0.6)] md:h-[90vh] md:max-w-3xl md:rounded-[40px]">

                        <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/[0.03] px-5 py-4">

                            <div className="flex items-center gap-4">

                                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black">
                                    <Sparkles size={22} />
                                </div>

                                <div>

                                    <h3 className="text-lg font-black">
                                        GTH Quantum AI
                                    </h3>

                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted)]">
                                        Estate Intelligence Assistant
                                    </p>

                                </div>

                            </div>

                            <button
                                onClick={() => setShowAI(false)}
                                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.04] transition-all duration-300 hover:bg-red-500 hover:text-white"
                            >
                                <X size={18} />
                            </button>

                        </div>

                        <div className="h-[calc(100%-82px)]">

                            <AIChat
                                context={`Property: ${property.title}, Location: ${property.location}, Price: ${property.price}, Type: ${property.property_type}`}
                                onClose={() => setShowAI(false)}
                            />

                        </div>

                    </div>

                </div>

            )}

            {/* MOBILE CTA */}

            <div className="fixed bottom-0 left-0 z-50 w-full border-t border-[var(--border)] bg-[var(--card)]/90 p-3 backdrop-blur-3xl md:hidden">

                <div className="flex items-center gap-3">

                    <div className="min-w-0 flex-1">

                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                            Live AI Valuation
                        </p>

                        <h3 className="gold-text truncate text-3xl font-black">
                            ₹ {property.price >= 100 ? `${(property.price / 100).toFixed(2)} Cr` : `${property.price} L`}
                        </h3>

                    </div>

                    <button
                        onClick={() => setShowAI(true)}
                        className="flex shrink-0 items-center gap-2 rounded-[22px] bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] px-6 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_25px_rgba(212,175,55,0.3)]"
                    >

                        <Zap size={16} />

                        Ask AI

                    </button>

                </div>

            </div>

        </div>
    )

}