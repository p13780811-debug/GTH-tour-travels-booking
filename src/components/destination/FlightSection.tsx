"use client"

import HeroSearch from "@/components/sections/HeroSearch"

interface FlightSectionProps {
    destination?: {
        name?: string
    }
}

export default function FlightSection({
    destination
}: FlightSectionProps) {

    return (

        <section className="relative bg-[var(--bg)] py-10 md:py-14">

            <div className="mx-auto max-w-7xl px-4 md:px-6">

                <div className="mb-8">

                    <span className="mb-3 inline-flex items-center rounded-full border border-[var(--border)] gth-glass px-4 py-2">

                        <span className="gold-text text-[10px] font-black uppercase tracking-[0.32em]">
                            Premium Flight Discovery
                        </span>

                    </span>

                    <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-4xl">

                        Flights to{" "}

                        <span className="gold-text">
                            {destination?.name || "Your Destination"}
                        </span>

                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)]">

                        Discover premium international flights,
                        luxury routes, exclusive airline deals
                        and seamless global travel experiences.

                    </p>

                </div>

                <HeroSearch city={destination?.name} />

            </div>

        </section>

    )

}