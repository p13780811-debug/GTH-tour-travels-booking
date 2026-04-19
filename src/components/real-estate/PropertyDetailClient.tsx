"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import styles from "@/app/real-estate/RealEstate.module.css"
import { MapPin, Sparkles } from "lucide-react"
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
}

export default function PropertyDetailClient({ slug }: { slug: string }) {
    const [property, setProperty] = useState<Property | null>(null)
    const [showAI, setShowAI] = useState(false)


    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("viewed_props") || "[]")

        const updated = [property?.id, ...saved.filter((x: any) => x !== property?.id)].slice(0, 10)

        localStorage.setItem("viewed_props", JSON.stringify(updated))
    }, [property])

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

    if (!property) {
        return (
            <div className="p-6 text-center text-gray-400">
                Loading property...
            </div>
        )
    }

    return (
        <div className={styles.mainContainer}>

            {/* 🏷 TITLE */}
            <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
                {property.title}
            </h1>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT CONTENT */}
                <div className="lg:col-span-2 space-y-6">

                    {/* IMAGE */}
                    <div className={styles.glassCard}>
                        <img
                            src={property.image}
                            className="w-full h-[260px] md:h-[420px] object-cover rounded-xl"
                        />
                    </div>

                    {/* DESCRIPTION */}
                    {property.description && (
                        <div className={styles.glassCard}>
                            <h2 className="text-lg font-semibold mb-2">
                                About this property
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {property.description}
                            </p>
                        </div>
                    )}

                    {/* MAP (REAL) */}
                    <div className={styles.glassCard}>
                        <h2 className="text-lg font-semibold mb-3">
                            Location
                        </h2>

                        <div className="h-64 rounded overflow-hidden">
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

                {/* RIGHT PANEL (AI + PRICE) */}
                <div className="space-y-6">

                    {/* PRICE CARD */}
                    <div className={styles.glassCard}>
                        <p className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin size={16} />
                            {property.location}
                        </p>

                        <p className="text-3xl font-bold text-cyan-400 mt-2">
                            ₹ {property.price} L
                        </p>

                        {/* AI CTA */}
                        <button
                            onClick={() => setShowAI(true)}
                            className="mt-4 w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            Ask AI About This Property
                        </button>

                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                            AI will verify details before connecting you
                        </p>
                    </div>

                    {/* TRUST CARD */}
                    <div className={styles.glassCard}>
                        <h3 className="text-sm font-semibold mb-2">
                            Why use AI?
                        </h3>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>✔ Smart price analysis</li>
                            <li>✔ Location insights</li>
                            <li>✔ Scam detection</li>
                            <li>✔ Best deal suggestion</li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* 🤖 AI CHAT MODAL */}
            {showAI && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center">
                    <div className="w-full md:w-[500px] h-[80%] bg-[#0a0f14] rounded-t-2xl md:rounded-2xl overflow-hidden">

                        <AIChat
                            context={`Property: ${property.title}, Location: ${property.location}, Price: ${property.price}`}
                            onClose={() => setShowAI(false)}
                        />

                    </div>
                </div>
            )}

            {/* 📱 MOBILE AI STICKY */}
            <div className="fixed bottom-0 left-0 w-full md:hidden bg-black/90 border-t border-white/10 p-3 flex justify-between items-center z-50">
                <span className="text-lg font-bold text-cyan-400">
                    ₹ {property.price} L
                </span>

                <button
                    onClick={() => setShowAI(true)}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-4 py-2 rounded-lg font-bold"
                >
                    Ask AI
                </button>
            </div>

        </div>
    )
}