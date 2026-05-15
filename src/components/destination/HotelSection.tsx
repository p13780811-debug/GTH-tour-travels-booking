import NetflixCarousel from "@/components/NetflixCarousel"

interface HotelSectionProps {
    destination: {
        name?: string
        hotels?: any[]
    }
}

export default function HotelSection({
    destination
}: HotelSectionProps) {

    const destinationName =
        destination?.name || "Global"

    const hotels =
        destination?.hotels || []

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-14 md:py-20">

            {/* ECOSYSTEM ATMOSPHERE */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-[var(--surface-1)] blur-[120px]" />

                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[var(--surface-2)] blur-[140px]" />

            </div>

            <div className="relative z-10 mx-auto max-w-7xl">

                {/* SECTION HEADER */}
                <div className="mb-10 px-4 md:px-6">

                    <div className="gth-glass mb-5 inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2">

                        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-soft)]">

                            Luxury Hospitality Network

                        </span>

                    </div>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                        <div className="max-w-3xl">

                            <h2 className="text-3xl font-black tracking-tight text-[var(--text)] md:text-5xl md:leading-[1]">

                                Premium hotels in{" "}

                                <span className="gold-text">
                                    {destinationName}
                                </span>

                            </h2>

                            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)] md:text-base">

                                Discover curated luxury stays,
                                premium resorts, boutique escapes
                                and elite hospitality experiences
                                crafted for modern global travelers.

                            </p>

                        </div>

                        {/* QUICK STATS */}
                        <div className="flex overflow-x-auto scrollbar-hide">

                            <div className="flex min-w-max gap-3">

                                <div className="gth-glass flex-shrink-0 rounded-full border border-[var(--border)] px-5 py-3">

                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">

                                        {hotels.length}+ Hotels

                                    </span>

                                </div>

                                <div className="gth-glass flex-shrink-0 rounded-full border border-[var(--border)] px-5 py-3">

                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">

                                        Curated Luxury

                                    </span>

                                </div>

                                <div className="gth-glass flex-shrink-0 rounded-full border border-[var(--border)] px-5 py-3">

                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">

                                        Global Ecosystem

                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* CAROUSEL */}
                <div className="relative">

                    <NetflixCarousel
                        title={`Hotels in ${destinationName}`}
                        tagline={`Luxury stays and curated hospitality experiences in ${destinationName}`}
                        items={hotels}
                        type="hotel"
                    />

                </div>

            </div>

        </section>

    )

}