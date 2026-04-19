"use client"

import { useEffect, useState } from "react"
import PropertyCardPro from "./PropertyCardPro"

export default function AIRecommendations({ slug, user }: any) {
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {

            const history = JSON.parse(localStorage.getItem("viewed_props") || "[]")

            const res = await fetch("/api/ai-recommend", {
                method: "POST",
                body: JSON.stringify({
                    slug,
                    history
                }),
            })

            const json = await res.json()
            setData(json || [])
        }

        load()
    }, [slug])

    const handleSelect = (p: any) => {
        window.location.href = `/real-estate/${p.slug}`
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {data.map((p) => (
                <div key={p.id} className="min-w-[280px]">
                    <PropertyCardPro
                        p={p}
                        user={user}
                        onSelect={handleSelect}
                        onLead={() => { }}
                        onBoost={() => { }}
                    />
                </div>
            ))}
        </div>
    )
}