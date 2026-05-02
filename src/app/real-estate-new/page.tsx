"use client"

import { useRouter } from "next/navigation"
import { Building2, TrendingUp, Globe2 } from "lucide-react"

export default function RealEstateLanding() {
    const router = useRouter()

    return (
        <div className="min-h-screen text-white px-6 py-8 
        bg-[radial-gradient(circle_at_50%_0%,#1a2a44,transparent_70%),#020617]">

            {/* 🔝 HEADER */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <h1 className="text-xl font-bold tracking-wide gold-text">
                    GTH PRO
                </h1>

                <div className="flex gap-8 text-sm text-gray-300">
                    <span className="gold-text border-b border-yellow-500 pb-1">Real Estate</span>
                    <span className="hover:text-white cursor-pointer">Projects</span>
                    <span className="hover:text-white cursor-pointer">Invest</span>
                    <span className="hover:text-white cursor-pointer">Account</span>
                </div>
            </div>

            {/* 🔥 HERO */}
            <div className="max-w-7xl mx-auto">
                <div className="relative p-[1px] rounded-3xl 
                bg-gradient-to-br from-white/20 to-transparent">

                    <div className="rounded-3xl 
                    bg-gradient-to-br from-[#1e293b]/80 to-[#020617]/90 
                    backdrop-blur-2xl border border-white/10 
                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_25px_100px_rgba(0,0,0,0.8)]
                    p-10">

                        <div className="grid md:grid-cols-2 gap-10 items-center">

                            {/* LEFT */}
                            <div>
                                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                                    GLOBAL PROPERTY <br />
                                    <span className="gold-text">MARKETPLACE</span>
                                </h2>

                                <p className="text-gray-400 mt-4 max-w-md">
                                    Discover luxury apartments, commercial projects & global investments.
                                </p>

                                <button
                                    onClick={() => router.push("/real-estate/explore")}
                                    className="mt-6 px-6 py-3 rounded-full font-bold text-black
                                    bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b38728]
                                    shadow-[0_0_25px_rgba(212,175,55,0.4)]
                                    hover:scale-105 transition-all"
                                >
                                    Explore Now
                                </button>
                            </div>

                            {/* RIGHT */}
                            <div>
                                <img
                                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                                    className="rounded-2xl w-full h-[260px] object-cover 
                                    shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* 💎 CATEGORY */}
            <div className="max-w-7xl mx-auto mt-14">
                <h3 className="text-2xl font-semibold mb-6">Select Your Category</h3>

                <div className="grid md:grid-cols-3 gap-6">

                    {[
                        {
                            title: "Luxury Apartments",
                            desc: "Premium residences in prime locations.",
                            icon: <Building2 className="text-yellow-400" size={40} />,
                            route: "/real-estate/luxury"
                        },
                        {
                            title: "Commercial Projects",
                            desc: "Offices, shops & business hubs.",
                            icon: <Globe2 className="text-blue-400" size={40} />,
                            route: "/real-estate/commercial"
                        },
                        {
                            title: "Global Investments",
                            desc: "High return investment opportunities.",
                            icon: <TrendingUp className="text-green-400" size={40} />,
                            route: "/real-estate/invest"
                        }
                    ].map((item, i) => (
                        <div
                            key={i}
                            onClick={() => router.push(item.route)}
                            className="group p-[1px] rounded-2xl 
                            bg-gradient-to-br from-white/20 to-transparent cursor-pointer"
                        >
                            <div className="p-6 rounded-2xl 
                            bg-gradient-to-br from-white/10 to-white/5 
                            backdrop-blur-xl border border-white/10
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_40px_rgba(0,0,0,0.7)]
                            hover:scale-105 hover:border-yellow-500/50 transition-all">

                                <div className="mb-4">{item.icon}</div>
                                <h4 className="text-lg font-bold">{item.title}</h4>
                                <p className="text-gray-400 text-sm mt-2">{item.desc}</p>

                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* 🏢 PROJECTS */}
            <div className="max-w-7xl mx-auto mt-16">
                <h3 className="text-2xl font-semibold mb-6">Real Estate & Projects</h3>

                <div className="grid md:grid-cols-3 gap-6">

                    {[
                        {
                            title: "Dubai Luxury Apartments",
                            image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae"
                        },
                        {
                            title: "India Commercial Projects",
                            image: "https://images.unsplash.com/photo-1494526585095-c41746248156"
                        },
                        {
                            title: "Global Investment Deals",
                            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa"
                        }
                    ].map((p, i) => (
                        <div
                            key={i}
                            className="group p-[1px] rounded-2xl 
                            bg-gradient-to-br from-white/20 to-transparent cursor-pointer"
                        >
                            <div className="bg-[#0b1220] rounded-2xl overflow-hidden
                            border border-white/10
                            shadow-[0_10px_40px_rgba(0,0,0,0.7)]
                            hover:scale-105 hover:border-yellow-500/40 transition-all">

                                <img src={p.image} className="h-44 w-full object-cover" />

                                <div className="p-4">
                                    <h4 className="font-bold">{p.title}</h4>
                                </div>

                            </div>
                        </div>
                    ))}

                </div>
            </div>

        </div>
    )
}