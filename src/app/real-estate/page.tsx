"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import RealEstateHero from "@/components/real-estate/RealEstateHero"
import { useThemeMode } from "@/lib/hooks/useThemeMode"
import PropertyCardPro from "@/components/real-estate/PropertyCardPro"
import MapWrapper from "@/components/MapWrapper"
import { PropertyService } from "@/lib/real-estate/propertyService"
import AddPropertyModal from "@/components/real-estate/AddPropertyModal"
import LeadsDashboard from "@/components/real-estate/LeadsDashboard"
import LoginModal from "@/components/real-estate/auth/LoginModal"
import BottomNav from "@/components/mobile/BottomNav"
import MapFullscreen from "@/components/mobile/MapFullscreen"
import FiltersSheet from "@/components/mobile/FiltersSheet"
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
    const theme = useThemeMode()
    const isDay = theme === "day"
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
        <div className="min-h-screen flex flex-col backdrop-blur-xl bg-transparent pb-24 md:pb-0">

            {/* HERO */}
            <RealEstateHero
                query={query}
                setQuery={setQuery}
                onSearch={aiSearch}
                properties={properties}
                setFiltered={setFiltered}
                setActive={setActive}
            />

            {isMobile && (
                <div className="p-3 space-y-2 pb-20">

                    {!user && (
                        <div className="gth-glass p-3 rounded-xl">
                            <p className="text-xs text-slate-400 mb-2">
                                Login for leads & dashboard
                            </p>
                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-full bg-cyan-500 text-black p-2 rounded font-bold"
                            >
                                LOGIN / REGISTER
                            </button>
                        </div>
                    )}

                    {/* MAP */}
                    <div className="h-44 rounded overflow-hidden border border-slate-700">
                        <MapWrapper data={filtered} active={active} />
                    </div>

                    {/* FILTER */}
                    <button
                        onClick={() => setShowFilters(true)}
                        className="w-full gth-glass text-black p-2 rounded font-bold"
                    >
                        Filters
                    </button>

                </div>
            )}




            {/* MAIN LAYOUT */}
            <div className="gth-container">

                <div className={isMobile ? "block" : "gth-layout"}>


                    {/* LEFT SIDEBAR */}

                    {!isMobile && (
                        <div className="gth-sidebar gth-glass p-4 h-fit sticky top-20">

                            {!user ? (
                                <div className="gth-glass p-4 rounded-xl mb-4">

                                    <h2 className="text-sm font-bold mb-2">
                                        Guest User
                                    </h2>

                                    <p className="text-xs text-slate-400 mb-3">
                                        Login to access dashboard, leads & premium boosts
                                    </p>
                                    <div className="order-3 md:order-1">
                                        <button
                                            onClick={() => setShowLogin(true)}
                                            className="w-full bg-cyan-500 text-black p-2 rounded font-bold"
                                        >
                                            LOGIN / REGISTER
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="gth-glass p-4 rounded-xl mb-4">

                                    <h2 className="text-sm font-bold">
                                        Agent Dashboard
                                    </h2>

                                    <p className="text-xs text-slate-400">
                                        {user.email}
                                    </p>

                                    <button
                                        onClick={() => setShowDashboard(true)}
                                        className="mt-3 w-full gth-btn-gold text-black p-2 rounded"
                                    >
                                        Open Dashboard
                                    </button>

                                    <button
                                        onClick={logout}
                                        className="mt-2 w-full bg-red-500 text-white p-2 rounded"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setShowFilters(true)}
                                className="fixed bottom-20 right-4 gth-btn-gold text-black px-4 py-2 rounded-full shadow-lg md:hidden"
                            >
                                Filters
                            </button>

                            <div className="mt-6">
                                <h2 className="text-sm font-bold mb-3 text-gth-gold">
                                    Categories
                                </h2>

                                <div className="space-y-2">
                                    {categories.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setQuery(c.query)
                                                aiSearch()
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg gth-glass hover:opacity-80 text-xs"
                                        >
                                            {c.icon} {c.title}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className="order-1 md:order-2">
                                <h2 className="font-black text-cyan-400 mb-4">Filters</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDashboard(false);
                                    setQuery("");
                                    fetchProperties(user)
                                }}
                                className="w-full gth-glass text-black p-2 rounded mb-3 font-bold uppercase text-[10px]"
                            >
                                Reset to Global View
                            </button>

                            <button
                                onClick={() => setQuery("2bhk")}
                                className="w-full gth-glass p-2 rounded mb-2"
                            >
                                2 BHK
                            </button>

                            <button
                                onClick={() => setQuery("under 5000000")}
                                className="w-full gth-glass p-2 rounded mb-4"
                            >
                                Under 50L
                            </button>

                            <div className="order-2 md:order-3">
                                <div className="gth-glass h-[220px] overflow-hidden">
                                    <MapWrapper data={filtered} active={active} />
                                </div>
                            </div>
                        </div>

                    )}


                    {/* RIGHT SIDE */}
                    <div className="flex-1 gth-stack">




                        {/* HEADER */}
                        {user && (
                            <div className="gth-glass p-4 rounded mb-4 border border-slate-700">
                                <h2 className="text-lg font-bold mb-2">📊 Your Dashboard</h2>

                                <div className="flex gap-6 text-sm">
                                    <p>Leads: {totalLeads}</p>
                                    <p>Boosted: {boosted}</p>
                                </div>
                            </div>

                        )}


                        <div className="flex justify-between items-center mb-8 px-2 md:px-0">

                            {/* Left Side: Title with GTH Luxury Typography */}
                            <h2 className="gth-title text-xl md:text-2xl uppercase tracking-wider">
                                Properties ({filtered.length})
                            </h2>

                            {/* Right Side: Add Property (Properly Aligned & Scaled) */}
                            <button
                                onClick={() => setShowAdd(true)}
                                className="gth-btn-gold text-black px-4 py-2 md:px-6 md:py-2.5 rounded-full font-bold whitespace-nowrap shadow-lg flex items-center gap-1 md:gap-2 hover:scale-105 transition-all z-30"
                            >
                                <span className="text-lg md:text-xl leading-none">+</span>
                                <span className="text-[10px] md:text-xs">ADD PROPERTY</span>
                            </button>

                        </div>


                        {aiRecommended.length > 0 && (
                            <section className="gth-section">
                                <div className="gth-container">

                                    <h2 className="text-xl font-bold mb-4 text-yellow-400">
                                        🤖 Recommended For You
                                    </h2>

                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">

                                        {aiRecommended.map((p) => (
                                            <div key={p.id} className="min-w-[260px]">
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



                        {/* GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-10">
                            {filtered.map((p) => (
                                <PropertyCardPro
                                    key={p.id}
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
                            ))}

                        </div>
                    </div>
                </div>
            </div>



            {/* MODALS */}
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
                <LoginModal onClose={() => setShowLogin(false)} />
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

            {isMobile && (

                <BottomNav
                    onMap={() => setShowMap(true)}
                    onFilter={() => setShowFilters(true)}
                />
            )}


        </div>


    )
}