"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NetflixCarousel from "@/components/NetflixCarousel"

interface RelatedSectionProps {
    currentSlug?: string
}

export default function RelatedSection({
    currentSlug
}: RelatedSectionProps) {

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {

        async function load() {

            const { data } = await supabase
                .from("destinations")
                .select("*")
                .neq("slug", currentSlug || "")
                .limit(6)

            setItems(data || [])

        }

        load()

    }, [currentSlug])

    if (items.length === 0) return null

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-10">

            {/* AMBIENT GLOW */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full gth-gold-glow" />

            </div>

            <div className="relative z-10">

                {/* TITLE WRAPPER */}
                <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between px-4 md:px-6">

                    <div>

                        <span className="mb-3 inline-flex items-center rounded-full border border-[var(--border)] gth-glass px-4 py-2">

                            <span className="gold-text text-[10px] font-black uppercase tracking-[0.32em]">
                                Curated Discovery
                            </span>

                        </span>

                        <h2 className="gold-text text-2xl font-black uppercase tracking-tight md:text-4xl">
                            Explore More
                        </h2>

                        <p className="mt-2 text-sm text-[var(--text-soft)]">
                            Your next luxury escape awaits
                        </p>

                    </div>

                </div>

                {/* EXISTING CAROUSEL */}
                <NetflixCarousel
                    title=""
                    tagline=""
                    items={items}
                    type="destination"
                />

            </div>

        </section>

    )

}