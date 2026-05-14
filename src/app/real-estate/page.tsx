"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import RealEstateHero from "@/components/real-estate/RealEstateHero"

import PropertyCardPro from "@/components/real-estate/PropertyCardPro"
import MapWrapper from "@/components/MapWrapper"
import { PropertyService } from "@/lib/real-estate/propertyService"
import AddPropertyModal from "@/components/real-estate/AddPropertyModal"
import LeadsDashboard from "@/components/real-estate/LeadsDashboard"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import BottomNav from "@/components/mobile/BottomNav"
import MapFullscreen from "@/components/mobile/MapFullscreen"
import FiltersSheet from "@/components/mobile/FiltersSheet"
import AIChatToggle from "@/components/AIChatToggle"
// ============================
// 🧠 MAIN APP
// ============================
export default function App() {
    const [user, setUser] = useState<any>(null)
    const [properties, setProperties] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [query, setQuery] = useState("")
    const [active, setActive] = useState<any>(null)

    const [showAdd, setShowAdd] = useState(false)
    const [showDashboard, setShowDashboard] = useState(false)

    const [leads, setLeads] = useState<any[]>([])
    const [showLogin, setShowLogin] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

    const router = useRouter()

    // 📱 Mobile Detection Logic
    const [isMobile, setIsMobile] = useState(false)

    const categories = [
        {
            title: "BUY PROPERTY",
            desc: "Find your dream home",
            icon: "🏠",
            query: "buy property"
        },
        {
            title: "RENT PROPERTY",
            desc: "Explore rental homes",
            icon: "🏢",
            query: "rent property"
        },
        {
            title: "COMMERCIAL",
            desc: "Office, shops & spaces",
            icon: "🏬",
            query: "commercial property"
        },
        {
            title: "LUXURY HOMES",
            desc: "Premium & high-end living",
            icon: "💎",
            query: "luxury villa"
        }
    ]

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // ============================
    // INIT
    // ============================
    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser()
            const currentUser = data.user
            setUser(currentUser)

            await fetchProperties(currentUser)

            if (currentUser) {
                const { data: leadsData } = await supabase
                    .from("leads")
                    .select("*")
                setLeads(leadsData || [])
            }
        }

        init()

        const channel = supabase
            .channel('properties-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'properties' },
                async () => {
                    const { data } = await supabase.auth.getUser()
                    await fetchProperties(data.user)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [showDashboard])


    type UserType = {
        email?: string
        id?: string
    }

    const fetchProperties = async (currentUser: UserType | null) => {
        let queryBuilder = supabase.from("properties").select("*");

        if (currentUser?.email && showDashboard) {
            queryBuilder = queryBuilder.eq("created_by", currentUser.email);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            console.error("Matrix Error:", error.message);
            return;
        }

        const sorted = (data || []).sort((a, b) => {
            const aBoost = a.is_featured ? 1 : 0;
            const bBoost = b.is_featured ? 1 : 0;

            if (bBoost !== aBoost) return bBoost - aBoost;

            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setProperties(sorted);
        setFiltered(sorted);
    };

    // ============================
    // SEARCH (AI + LOCAL)
    // ============================
    const aiSearch = async () => {
        if (!query) return

        let filters: any = {}

        try {
            const res = await fetch("/api/ai-search", {
                method: "POST",
                body: JSON.stringify({ query }),
            })
            filters = await res.json()
        } catch { }

        if (!filters || Object.keys(filters).length === 0) {
            const q = query.toLowerCase()

            const cities = ["mumbai", "delhi", "kolkata", "bangalore", "pune"]
            let city = cities.find(c => q.includes(c)) || ""

            let minPrice = 0
            let maxPrice = Infinity
            let type = ""

            const priceMatch = q.match(/(\d+)(k|lakh|lac|crore)?/)
            if (priceMatch) {
                let value = Number(priceMatch[1])
                const unit = priceMatch[2]

                if (unit === "k") value *= 1000
                if (unit === "lakh" || unit === "lac") value *= 100000
                if (unit === "crore") value *= 10000000

                if (q.includes("under")) maxPrice = value
                if (q.includes("above")) minPrice = value
            }

            if (q.includes("2bhk")) type = "2bhk"
            if (q.includes("3bhk")) type = "3bhk"
            if (q.includes("villa")) type = "villa"

            filters = { city, minPrice, maxPrice, type }
        }

        const result = properties.filter((p) => {
            const price = Number(p.price || 0)

            return (
                (!filters.city || p.location?.toLowerCase().includes(filters.city)) &&
                (!filters.minPrice || price >= filters.minPrice) &&
                (!filters.maxPrice || price <= filters.maxPrice) &&
                (!filters.type || p.title?.toLowerCase().includes(filters.type))
            )
        })

        setFiltered(result)

        if (result[0]?.lat && result[0]?.lng) {
            setActive({
                id: result[0].id,
                coords: [result[0].lat, result[0].lng],
            })
        }
    }

    // ============================
    // AUTH
    // ============================
    const login = async () => {
        const email = prompt("Enter email")
        if (!email) return
        await supabase.auth.signInWithOtp({ email })
        alert("Check email")
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    // ============================
    // PROPERTY
    // ============================
    const addProperty = async (form: any) => {
        if (!user) {
            alert("Please login first")
            return
        }
        const payload = {
            ...form,
            slug: form.title?.toLowerCase().replace(/\s+/g, "-"),
            is_featured: false,
            boost_expiry: null,
            created_by: user?.email || "guest"
        }

        await PropertyService.add(payload)
        setShowAdd(false)
        fetchProperties(user)
    }

    const addLead = async (id: number) => {
        const phone = prompt("Enter phone")
        if (!phone) return
        await PropertyService.addLead({ property_id: id, phone })
        alert("Lead added")
    }

    const payForBoost = async (id: number) => {
        alert("Demo: Payment system next step me connect hoga")

        await supabase
            .from("properties")
            .update({
                is_featured: true,
                boost_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            })
            .eq("id", id)

        fetchProperties(user)
    }

    const totalLeads = leads.length
    const boosted = properties.filter(p => p.is_featured).length

    const getAIRecommendations = () => {
        if (!properties.length) return []

        return properties
            .filter(p => p.is_featured || p.price < 50)
            .slice(0, 6)
    }

    const aiRecommended = getAIRecommendations()

    // ============================
    // UI
    // ============================
    return (
        <div className="min-h-screen relative overflow-hidden pb-24 md:pb-0">

            {/* ====================================================== */}
            {/* 🌌 PREMIUM BACKGROUND */}
            {/* ====================================================== */}

            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

                <div className="absolute top-[-120px] left-[-80px] w-[320px] h-[320px] rounded-full blur-3xl bg-blue-500/10" />

                <div className="absolute top-[20%] right-[-120px] w-[360px] h-[360px] rounded-full blur-3xl bg-purple-500/10" />

                <div className="absolute bottom-[-140px] left-[20%] w-[300px] h-[300px] rounded-full blur-3xl bg-amber-400/10" />

            </div>

            {/* ====================================================== */}
            {/* 🏆 HERO */}
            {/* ====================================================== */}

            <RealEstateHero
                query={query}
                setQuery={setQuery}
                onSearch={aiSearch}
                properties={properties}
                setFiltered={setFiltered}
                setActive={setActive}
            />

            {/* ====================================================== */}
            {/* ⚡ QUICK CATEGORY ENGINE */}
            {/* ====================================================== */}

            <section className="px-3 md:px-6 -mt-6 relative z-20">

                <div className="gth-glass-ultra rounded-[30px] p-4 md:p-6 border border-white/10 shadow-2xl overflow-hidden">

                    <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">

                        <div className="min-w-0">

                            <h2 className="text-lg md:text-2xl font-black gold-text uppercase tracking-wider">
                                Explore Categories
                            </h2>

                            <p className="text-xs opacity-70 mt-1">
                                AI-powered luxury property discovery
                            </p>

                        </div>

                        {/* DESKTOP BADGES */}

                        <div className="hidden lg:flex items-center gap-2 shrink-0">

                            <div className="gth-badge">
                                🔥 Trending
                            </div>

                            <div className="gth-badge">
                                🤖 Smart AI
                            </div>

                        </div>

                    </div>

                    {/* CATEGORY SCROLL FIX */}

                    <div className="overflow-x-auto scrollbar-hide">

                        <div className="flex gap-3 min-w-max pb-2">

                            {[
                                {
                                    name: "Buy",
                                    icon: "🏠",
                                    q: "buy property",
                                    glow: "from-blue-500/20 to-cyan-500/10"
                                },
                                {
                                    name: "Rent",
                                    icon: "🏢",
                                    q: "rent property",
                                    glow: "from-emerald-500/20 to-green-500/10"
                                },
                                {
                                    name: "Luxury",
                                    icon: "💎",
                                    q: "luxury villa",
                                    glow: "from-purple-500/20 to-indigo-500/10"
                                },
                                {
                                    name: "Commercial",
                                    icon: "🏬",
                                    q: "commercial property",
                                    glow: "from-orange-500/20 to-amber-500/10"
                                },
                                {
                                    name: "Plots",
                                    icon: "📍",
                                    q: "plots",
                                    glow: "from-pink-500/20 to-rose-500/10"
                                },
                            ].map((c, i) => (

                                <button
                                    key={i}
                                    onClick={() => {
                                        setQuery(c.q)
                                        aiSearch()
                                    }}
                                    className="
                  relative overflow-hidden
                  min-w-[120px]
                  md:min-w-[150px]
                  rounded-2xl
                  p-4
                  text-left
                  transition-all duration-300
                  hover:scale-[1.03]
                  gth-glass
                  shrink-0
                "
                                >

                                    <div className={`
                  absolute inset-0 opacity-60
                  bg-gradient-to-br ${c.glow}
                `} />

                                    <div className="relative z-10">

                                        <div className="text-2xl mb-3">
                                            {c.icon}
                                        </div>

                                        <h3 className="text-sm font-bold uppercase tracking-wide">
                                            {c.name}
                                        </h3>

                                        <p className="text-[11px] opacity-70 mt-1">
                                            AI Curated
                                        </p>

                                    </div>

                                </button>

                            ))}

                        </div>

                    </div>

                </div>

            </section>

            {/* ====================================================== */}
            {/* 📱 MOBILE QUICK UI */}
            {/* ====================================================== */}

            {isMobile && (

                <div className="p-3 space-y-4 mt-2">

                    {!user && (

                        <div className="gth-glass-ultra rounded-2xl p-4">

                            <h2 className="font-bold text-sm mb-2">
                                Unlock Premium Features
                            </h2>

                            <p className="text-xs opacity-70 mb-4">
                                Access dashboard, leads & boosted listings
                            </p>

                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full gth-btn"
                            >
                                LOGIN / REGISTER
                            </button>

                        </div>

                    )}

                    <div className="h-48 rounded-3xl overflow-hidden gth-glass-ultra">

                        <MapWrapper
                            data={filtered}
                            active={active}
                        />

                    </div>

                    <button
                        onClick={() => setShowFilters(true)}
                        className="w-full gth-btn-gold py-3"
                    >
                        ✨ OPEN SMART FILTERS
                    </button>

                </div>

            )}

            {/* ====================================================== */}
            {/* 🏛️ MAIN DESKTOP LAYOUT */}
            {/* ====================================================== */}

            <div className="gth-container mt-6 px-3 md:px-4">

                <div
                    className={
                        isMobile
                            ? "block"
                            : "grid grid-cols-[320px_minmax(0,1fr)] gap-7 items-start"
                    }
                >

                    {/* ================================================= */}
                    {/* 🧠 SIDEBAR */}
                    {/* ================================================= */}

                    {!isMobile && (

                        <aside className="w-[320px] shrink-0 sticky top-24 space-y-5">

                            {/* USER */}

                            {!user ? (

                                <div className="gth-glass-ultra p-5 rounded-3xl">

                                    <h2 className="font-black text-lg mb-2">
                                        Guest Access
                                    </h2>

                                    <p className="text-sm opacity-70 mb-4">
                                        Login to unlock premium dashboard & AI tools
                                    </p>

                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="w-full gth-btn"
                                    >
                                        LOGIN / REGISTER
                                    </button>

                                </div>

                            ) : (

                                <div className="gth-glass-ultra p-5 rounded-3xl">

                                    <div className="flex items-start justify-between mb-4">

                                        <div className="min-w-0">

                                            <h2 className="font-black">
                                                Agent Dashboard
                                            </h2>

                                            <p className="text-xs opacity-70 truncate mt-1">
                                                {user.email}
                                            </p>

                                        </div>

                                        <div className="text-2xl shrink-0">
                                            🏆
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">

                                        <div className="gth-glass rounded-2xl p-3">

                                            <p className="text-[10px] opacity-60 uppercase">
                                                Leads
                                            </p>

                                            <h2 className="text-xl font-black mt-1">
                                                {totalLeads}
                                            </h2>

                                        </div>

                                        <div className="gth-glass rounded-2xl p-3">

                                            <p className="text-[10px] opacity-60 uppercase">
                                                Boosted
                                            </p>

                                            <h2 className="text-xl font-black mt-1">
                                                {boosted}
                                            </h2>

                                        </div>

                                    </div>

                                    <button
                                        onClick={() => setShowDashboard(true)}
                                        className="w-full gth-btn-gold mb-2"
                                    >
                                        OPEN DASHBOARD
                                    </button>

                                    <button
                                        onClick={logout}
                                        className="w-full gth-btn"
                                    >
                                        LOGOUT
                                    </button>

                                </div>

                            )}

                            {/* FILTERS */}

                            <div className="gth-glass-ultra rounded-3xl p-5">

                                <div className="flex items-center justify-between mb-4">

                                    <h2 className="font-black gold-text uppercase tracking-wide text-sm">
                                        Smart Filters
                                    </h2>

                                    <span className="text-xs opacity-60">
                                        AI
                                    </span>

                                </div>

                                <div className="space-y-3">

                                    {[
                                        "2BHK",
                                        "3BHK",
                                        "Villa",
                                        "Near Metro",
                                        "Luxury",
                                        "Under 50L"
                                    ].map((t, i) => (

                                        <button
                                            key={i}
                                            onClick={() => {
                                                setQuery(t)
                                                aiSearch()
                                            }}
                                            className="
                      w-full
                      text-left
                      gth-glass
                      rounded-2xl
                      px-4 py-3
                      transition-all
                      hover:scale-[1.02]
                    "
                                        >
                                            {t}
                                        </button>

                                    ))}

                                </div>

                            </div>

                            {/* MAP */}

                            <div className="h-[320px] rounded-3xl overflow-hidden gth-glass-ultra">

                                <MapWrapper
                                    data={filtered}
                                    active={active}
                                />

                            </div>

                        </aside>

                    )}

                    {/* ================================================= */}
                    {/* 🏠 MAIN CONTENT */}
                    {/* ================================================= */}

                    <div className="min-w-0 w-full">

                        {/* TOP BAR */}

                        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">

                            <div className="min-w-0">

                                <h1 className="gth-title uppercase">
                                    Properties
                                </h1>

                                <p className="opacity-70 text-sm mt-2">
                                    {filtered.length} curated properties found
                                </p>

                            </div>

                            {/* BUTTON FIX */}

                            <button
                                onClick={() => setShowAdd(true)}
                                className="
                shrink-0
                gth-btn-gold
                px-5 py-3
                rounded-full
                flex items-center
                gap-2
                whitespace-nowrap
              "
                            >
                                <span className="text-lg">+</span>
                                ADD PROPERTY
                            </button>

                        </div>

                        {/* ================================================= */}
                        {/* 🤖 AI RECOMMENDATIONS */}
                        {/* ================================================= */}

                        {aiRecommended.length > 0 && (

                            <section className="mb-10">

                                <div className="flex items-center justify-between mb-5">

                                    <div>

                                        <h2 className="text-2xl font-black gold-text">
                                            🤖 AI Recommendations
                                        </h2>

                                        <p className="text-sm opacity-70 mt-1">
                                            Personalized luxury picks
                                        </p>

                                    </div>

                                    <div className="hidden lg:flex gth-badge">
                                        Smart Match
                                    </div>

                                </div>

                                {/* DESKTOP SCROLL FIX */}

                                <div className="overflow-x-auto scrollbar-hide">

                                    <div className="flex gap-5 min-w-max pb-2">

                                        {aiRecommended.map((p) => (

                                            <div
                                                key={p.id}
                                                className="
                        min-w-[260px]
                        md:min-w-[280px]
                        lg:min-w-[300px]
                        max-w-[300px]
                        flex-shrink-0
                      "
                                            >

                                                <PropertyCardPro
                                                    p={p}
                                                    user={user}
                                                    onSelect={(prop: any) => {
                                                        router.push(`/real-estate/${prop.slug}`)
                                                    }}
                                                    onLead={addLead}
                                                    onBoost={payForBoost}
                                                />

                                            </div>

                                        ))}

                                    </div>

                                </div>

                            </section>

                        )}

                        {/* ================================================= */}
                        {/* 🏠 PROPERTY GRID */}
                        {/* ================================================= */}

                        <section>

                            <div
                                className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-3
                2xl:grid-cols-4
                gap-5
                md:gap-6
              "
                            >

                                {filtered.map((p) => (

                                    <div
                                        key={p.id}
                                        className="w-full min-w-0"
                                    >

                                        <PropertyCardPro
                                            p={p}
                                            user={user}
                                            onSelect={(prop: any) => {

                                                if (!prop?.lat || !prop?.lng) return

                                                setActive({
                                                    id: prop.id,
                                                    coords: [prop.lat, prop.lng]
                                                })
                                            }}
                                            onLead={addLead}
                                            onBoost={payForBoost}
                                        />

                                    </div>

                                ))}

                            </div>

                        </section>

                    </div>

                </div>

            </div>

            {/* ====================================================== */}
            {/* 🧩 MODALS */}
            {/* ====================================================== */}

            {showAdd && (

                <AddPropertyModal
                    onSave={addProperty}
                    onClose={() => setShowAdd(false)}
                />

            )}

            {showDashboard && (

                <LeadsDashboard
                    onClose={() => setShowDashboard(false)}
                    properties={properties}
                />

            )}

            {showLogin && (

                <LoginModal
                    onClose={() => setShowLogin(false)}
                />

            )}

            <MapFullscreen
                open={showMap}
                onClose={() => setShowMap(false)}
                data={filtered}
                active={active}
            />

            <FiltersSheet
                open={showFilters}
                onClose={() => setShowFilters(false)}
                setQuery={setQuery}
            />

            {/* ====================================================== */}
            {/* 📱 MOBILE NAV */}
            {/* ====================================================== */}

            {isMobile && (

                <BottomNav />

            )}

            {/* ====================================================== */}
            {/* 🤖 AI CHAT */}
            {/* ====================================================== */}

            <div className="relative z-[999999]">

                <AIChatToggle
                    properties={properties}
                    setFiltered={setFiltered}
                    setActive={setActive}
                />

            </div>

        </div>
    )
}
