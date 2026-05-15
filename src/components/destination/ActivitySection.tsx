'use client'

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ActivitySectionProps {
    destination: any
}

export default function ActivitySection({
    destination
}: ActivitySectionProps) {

    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const sliderRef = useRef<HTMLDivElement>(null)

    useEffect(() => {

        async function getActivities() {

            try {

                if (!destination?.slug) {
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from("activities")
                    .select("*")
                    .eq("city_slug", destination.slug)

                if (error) {
                    console.error(error)
                    setActivities([])
                    setLoading(false)
                    return
                }

                setActivities(data || [])

            } catch (err) {

                console.error(err)
                setActivities([])

            } finally {

                setLoading(false)

            }

        }

        getActivities()

    }, [destination])

    const featuredActivities = useMemo(() => {
        return activities.slice(0, 12)
    }, [activities])

    const scrollSlider = (direction: "left" | "right") => {

        if (!sliderRef.current) return

        const scrollAmount = window.innerWidth < 768 ? 280 : 420

        sliderRef.current.scrollBy({
            left: direction === "left"
                ? -scrollAmount
                : scrollAmount,
            behavior: "smooth"
        })

    }

    if (loading) {

        return (

            <section className="relative overflow-hidden bg-[var(--bg)] py-20">

                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                    <div className="absolute left-[10%] top-10 h-40 w-40 rounded-full bg-[var(--surface-2)] blur-[var(--blur-xl)]" />

                    <div className="absolute right-[12%] bottom-10 h-52 w-52 rounded-full bg-[var(--surface-1)] blur-[var(--blur-xl)]" />

                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 text-center md:px-6">

                    <div className="gth-badge mb-5">

                        <Sparkles size={12} className="text-[var(--gold)]" />

                        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-soft)]">
                            Curated Experiences
                        </span>

                    </div>

                    <h2 className="gth-title max-w-3xl tracking-tight text-[var(--text)]">
                        Loading premium experiences in{" "}
                        <span className="gold-text">
                            {destination?.name || "destination"}
                        </span>
                    </h2>

                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">
                        Preparing immersive activities, luxury adventures and elite travel moments.
                    </p>

                </div>

            </section>

        )

    }

    if (featuredActivities.length === 0) {

        return (

            <section className="relative overflow-hidden bg-[var(--bg)] py-24">

                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                    <div className="absolute left-1/2 top-16 h-52 w-52 -translate-x-1/2 rounded-full bg-[var(--surface-2)] blur-[var(--blur-xl)]" />

                </div>

                <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-6">

                    <div className="gth-badge mb-6">

                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-soft)]">
                            Experience Layer
                        </span>

                    </div>

                    <h2 className="gth-title tracking-tight text-[var(--text)]">
                        Experiences arriving soon in{" "}
                        <span className="gold-text">
                            {destination?.name}
                        </span>
                    </h2>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-soft)]">
                        Our concierge engine is currently curating premium activities, cinematic tours and private experiences for this destination.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">

                        <div className="gth-glass rounded-full border border-[var(--border)] px-5 py-3">

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                Luxury Escapes
                            </span>

                        </div>

                        <div className="gth-glass rounded-full border border-[var(--border)] px-5 py-3">

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                Private Tours
                            </span>

                        </div>

                        <div className="gth-glass rounded-full border border-[var(--border)] px-5 py-3">

                            <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                Premium Discovery
                            </span>

                        </div>

                    </div>

                </div>

            </section>

        )

    }

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-20 md:py-28">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <div className="absolute left-[8%] top-10 h-56 w-56 rounded-full bg-[var(--surface-2)] blur-[var(--blur-xl)]" />

                <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-[var(--surface-1)] blur-[var(--blur-xl)]" />

            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">

                <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

                    <div className="max-w-3xl">

                        <div className="gth-badge mb-5">

                            <Sparkles size={12} className="text-[var(--gold)]" />

                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-soft)]">
                                Elite Experience Layer
                            </span>

                        </div>

                        <h2 className="gth-title tracking-tight text-[var(--text)] md:leading-[0.95]">

                            Discover premium experiences in{" "}

                            <span className="gold-text">
                                {destination?.name}
                            </span>

                        </h2>

                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-soft)]">

                            Handpicked adventures, private escapes, curated cultural journeys and world-class activities designed for modern global explorers.

                        </p>

                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => scrollSlider("left")}
                            className="gth-glass flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] transition-all duration-300 hover:-translate-y-0.5"
                            aria-label="Previous activities"
                        >

                            <ChevronLeft
                                size={18}
                                className="text-[var(--text)]"
                            />

                        </button>

                        <button
                            onClick={() => scrollSlider("right")}
                            className="gth-btn-gold flex h-12 w-12 items-center justify-center rounded-full"
                            aria-label="Next activities"
                        >

                            <ChevronRight size={18} />

                        </button>

                    </div>

                </header>

                <div
                    ref={sliderRef}
                    className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
                >

                    {featuredActivities.map((item, index) => (

                        <article
                            key={`${item?.id || item?.title}-${index}`}
                            className="gth-card-premium gth-glass flex min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] md:min-w-[360px] md:max-w-[360px]"
                        >

                            <div className="relative h-[260px] overflow-hidden">

                                <Image
                                    src={
                                        item?.image_url ||
                                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop"
                                    }
                                    alt={item?.title || "Luxury experience"}
                                    fill
                                    sizes="(max-width:768px) 280px, 360px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.55)] via-transparent to-transparent" />

                                <div className="absolute left-4 top-4">

                                    <div className="gth-glass rounded-full border border-[var(--border)] px-3 py-2">

                                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text)]">

                                            Curated Escape

                                        </span>

                                    </div>

                                </div>

                                <div className="absolute bottom-4 left-4">

                                    <div className="gth-glass rounded-full border border-[var(--border)] px-4 py-2">

                                        <span className="text-xs font-black tracking-[0.08em] text-[var(--gold)]">

                                            ₹{item?.price || "4,999"}

                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="flex flex-1 flex-col justify-between p-6">

                                <div>

                                    <h3 className="line-clamp-2 text-xl font-black tracking-tight text-[var(--text)]">

                                        {item?.title}

                                    </h3>

                                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--text-soft)]">

                                        {item?.description ||
                                            `Luxury curated experiences and unforgettable moments across ${destination?.name}.`
                                        }

                                    </p>

                                </div>

                                <div className="mt-8 flex items-center justify-between gap-4">

                                    <div className="flex flex-col">

                                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">

                                            Premium Access

                                        </span>

                                        <span className="mt-1 text-sm font-semibold text-[var(--text)]">

                                            Instant Confirmation

                                        </span>

                                    </div>

                                    <button className="gth-btn-gold whitespace-nowrap px-5 py-3 text-xs font-black uppercase tracking-[0.18em]">

                                        Reserve

                                    </button>

                                </div>

                            </div>

                        </article>

                    ))}

                </div>

            </div>

        </section>

    )

}