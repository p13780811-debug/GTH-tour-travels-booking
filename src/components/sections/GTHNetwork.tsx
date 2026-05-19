"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Partner = {
    name: string;
    image: string;
    link: string;
};

export default function GTHNetwork({
    partners = [],
}: {
    partners?: Partner[];
}) {
    const sliderRef = useRef<HTMLDivElement | null>(null);

    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);

    if (!partners || partners.length === 0) return null;

    const updateButtons = () => {
        if (!sliderRef.current) return;

        const slider = sliderRef.current;

        setCanLeft(slider.scrollLeft > 10);

        setCanRight(
            slider.scrollLeft <
            slider.scrollWidth - slider.clientWidth - 10
        );
    };

    const scrollSlider = (direction: "left" | "right") => {
        if (!sliderRef.current) return;

        const slider = sliderRef.current;

        const cardWidth =
            window.innerWidth < 768
                ? 260
                : window.innerWidth < 1280
                    ? 320
                    : 360;

        slider.scrollBy({
            left:
                direction === "left"
                    ? -cardWidth
                    : cardWidth,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        updateButtons();

        const slider = sliderRef.current;

        if (!slider) return;

        slider.addEventListener("scroll", updateButtons);

        window.addEventListener("resize", updateButtons);

        return () => {
            slider.removeEventListener(
                "scroll",
                updateButtons
            );

            window.removeEventListener(
                "resize",
                updateButtons
            );
        };
    }, []);

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] py-14 md:py-20">

            {/* TOP AREA */}

            <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-6 px-4 md:px-6">

                {/* LEFT */}

                <div className="max-w-2xl">

                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 gth-glass">

                        <Globe2
                            size={14}
                            className="text-[var(--text-soft)]"
                        />

                        <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--text-soft)]">
                            GTH Global Network
                        </span>

                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-[var(--text)] md:text-5xl">

                        Verified Global
                        Partner Ecosystem

                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)] md:text-base">

                        Discover premium hospitality,
                        travel, luxury lifestyle and
                        verified international ecosystem
                        partnerships connected through
                        the GTH network.

                    </p>

                </div>

                {/* RIGHT */}

                <div className="hidden items-center gap-3 md:flex">

                    <button
                        onClick={() => scrollSlider("left")}
                        disabled={!canLeft}
                        className={`
                            flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] transition-all duration-300
                            ${canLeft
                                ? "gth-glass text-[var(--text)] hover:scale-105"
                                : "bg-[var(--card)] text-[var(--text-soft)] opacity-40"
                            }
                        `}
                    >

                        <ChevronLeft size={18} />

                    </button>

                    <button
                        onClick={() => scrollSlider("right")}
                        disabled={!canRight}
                        className={`
                            flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] transition-all duration-300
                            ${canRight
                                ? "gth-btn-gold hover:scale-105"
                                : "bg-[var(--card)] text-[var(--text-soft)] opacity-40"
                            }
                        `}
                    >

                        <ChevronRight size={18} />

                    </button>

                </div>

            </div>

            {/* SLIDER */}

            <div className="relative mt-10">

                {/* LEFT FADE - UPGRADED TO SMOOTH GRADIENT */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-28 md:block" />

                {/* RIGHT FADE - UPGRADED TO SMOOTH GRADIENT */}
                <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-28 md:block" />

                <div
                    ref={sliderRef}
                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 scrollbar-hide md:px-6"
                >

                    {partners.map((partner, index) => (

                        <Link
                            key={`${partner.name}-${index}`}
                            href={partner.link || "#"}
                            target="_blank"
                            className="group relative min-w-[240px] snap-start md:min-w-[300px] xl:min-w-[340px]"
                        >

                            <article className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow)]">

                                {/* IMAGE */}

                                <div className="relative h-[220px] overflow-hidden md:h-[260px] xl:h-[300px]">

                                    <Image
                                        src={
                                            partner.image ||
                                            "/placeholder.jpg"
                                        }
                                        alt={
                                            partner.name ||
                                            "Partner"
                                        }
                                        fill
                                        unoptimized
                                        sizes="(max-width:768px) 240px, (max-width:1280px) 300px, 340px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                </div>

                                {/* CONTENT */}

                                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">

                                    <div className="rounded-[24px] border border-[var(--border)] p-4 gth-glass">

                                        <div className="flex items-start justify-between gap-4">

                                            <div>

                                                <div className="mb-3 inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 gth-glass">

                                                    <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">

                                                        Verified Access

                                                    </span>

                                                </div>

                                                <h3 className="line-clamp-2 text-lg font-black uppercase tracking-tight text-[var(--text)] md:text-xl">

                                                    GTH {partner.name}

                                                </h3>

                                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-soft)]">

                                                    Connected premium
                                                    ecosystem partner
                                                    with verified
                                                    global reach.

                                                </p>

                                            </div>

                                        </div>

                                        <div className="mt-5">

                                            <div className="gth-btn flex h-11 w-full items-center justify-center rounded-full text-[10px] font-black uppercase tracking-[0.24em]">

                                                View Partner Access

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </article>

                        </Link>

                    ))}

                </div>

            </div>

        </section>

    );
}