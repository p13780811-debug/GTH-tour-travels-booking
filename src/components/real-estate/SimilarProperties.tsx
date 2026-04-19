"use client"

import { useEffect, useState } from "react"
import PropertyCardPro from "./PropertyCardPro"

export default function SimilarProperties({ slug, user }: any) {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const res = await fetch(`/api/similar?slug=${slug}`)
            const json = await res.json()
            setData(json || [])
        }
        load()
    }, [slug])

    const handleSelect = (p: any) => {
        window.location.href = `/real-estate/${p.slug}`
    }

    const handleLead = (id: number) => {
        console.log("Lead sent:", id)
    }

    const handleBoost = (id: number) => {
        alert("Boost clicked for " + id)
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {data.map((p) => (
                <div key={p.id} className="min-w-[280px]">
                    <PropertyCardPro
                        p={p}
                        user={user}
                        onSelect={handleSelect}
                        onLead={handleLead}
                        onBoost={handleBoost}
                    />
                </div>
            ))}
        </div>
    )
}