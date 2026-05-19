"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
    Search,
    Plane,
    Hotel,
    Building2,
    Train,
    Bus,
    Sparkles,
    Globe2,
    ShieldCheck,
    BriefcaseBusiness,
    ArrowRight,
    Stars
} from "lucide-react"

import TripPlanner from "@/components/TripPlanner"

const slides = [
    {
        title: "Maldives Elite Escape",
        subtitle:
            "Ultra luxury island infrastructure powered through GTH global mobility systems.",
        image:
            "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=2400&auto=format&fit=crop",
        type: "Hotels"
    },
    {
        title: "Global Property Intelligence",
        subtitle:
            "Cross-border real-estate discovery with AI driven premium asset routing.",
        image:
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2400&auto=format&fit=crop",
        type: "Real Estate"
    },
    {
        title: "Cinematic World Tours",
        subtitle:
            "Editorial-grade journeys designed for creators, explorers and luxury travellers.",
        image:
            "/images/mega/tours.jpg",
        type: "Tours"
    },
    {
        title: "Next Generation Aviation",
        subtitle:
            "Private aviation, airline routing and smart global travel synchronization.",
        image:
            "/images/mega/flights.jpg",
        type: "Flights"
    }
]

const tabs = [
    {
        name: "Hotels",
        href: "/hotels",
        icon: Hotel
    },
    {
        name: "Flights",
        href: "/flights",
        icon: Plane
    },
    {
        name: "Rail",
        href: "/rail",
        icon: Train
    },
    {
        name: "Bus",
        href: "/bus",
        icon: Bus
    },
    {
        name: "Tours",
        href: "/tours",
        icon: Globe2
    },
    {
        name: "AI Trips",
        href: "/ai-trips",
        icon: Sparkles
    },
    {
        name: "Real Estate",
        href: "/real-estate",
        icon: Building2
    },
    {
        name: "Tender",
        href: "/tender",
        icon: BriefcaseBusiness
    }
]

export default function HeroUltra() {

    const [current, setCurrent] = useState(0)

    useEffect(() => {

        const interval = setInterval(() => {

            setCurrent((prev) => (prev + 1) % slides.length)

        }, 6500)

        return () => clearInterval(interval)

    }, [])

    return (

        <section className="relative px-3 pt-3 md:px-5 md:pt-5">

            <div className="relative mx-auto overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--card)] min-h-[930px] xl:min-h-[680px] xl:max-w-[1700px]">

                {/* BG IMAGES */}
                <div className="absolute inset-0">

                    {slides.map((slide, index) => (

                        <div
                            key={slide.title}
                            className={`absolute inset-0 transition-all duration-[2200ms] ${current === index
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-[1.03]"
                                }`}
                        >

                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                priority
                                className="object-cover object-center"
                            />

                        </div>

                    ))}

                    {/* DEPTH */}
                    <div className="absolute inset-0 bg-[var(--bg)]/10" />

                    {/* DESKTOP LEFT DEPTH */}
                    <div className="absolute inset-y-0 left-0 hidden xl:block w-[54%] bg-[var(--bg)]/10" />

                    {/* BOTTOM DEPTH */}
                    <div className="absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-[var(--bg)]/10 to-transparent" />

                </div>

                {/* TOP STATUS */}
                <div className="absolute left-4 right-4 top-4 z-40 md:left-6 md:right-6">

                    <div className="flex items-center justify-between gap-3">

                        <div className="gth-glass flex h-11 items-center gap-3 rounded-full border border-[var(--border)] px-5">

                            <span className="h-2 w-2 rounded-full bg-[var(--text)] animate-pulse" />

                            <span className="text-[10px] tracking-[0.26em] text-[var(--text-soft)]">
                                GLOBAL NETWORK ACTIVE
                            </span>

                        </div>

                        <div className="hidden md:flex gth-glass h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5">

                            <ShieldCheck
                                size={15}
                                className="text-[var(--text)]"
                            />

                            <span className="text-[10px] tracking-[0.2em] text-[var(--text-soft)]">
                                VERIFIED AI ROUTING
                            </span>

                        </div>

                    </div>

                </div>

                {/* TABS */}
                <div className="absolute left-4 right-4 top-[78px] z-40 md:left-6 md:right-6">

                    <div className="flex gap-2 overflow-x-auto no-scrollbar">

                        {tabs.map((tab) => (

                            <Link
                                key={tab.name}
                                href={tab.href}
                                className="gth-glass flex h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-[var(--text-soft)] transition-all duration-300 hover:text-[var(--text)]"
                            >

                                <tab.icon size={14} />

                                <span className="text-[10px] font-bold tracking-[0.18em]">
                                    {tab.name}
                                </span>

                            </Link>

                        ))}

                    </div>

                </div>

                {/* DESKTOP CONTENT */}
                <div className="relative z-30 hidden h-full xl:flex">

                    {/* LEFT */}
                    <div className="flex w-[56%] items-center px-16 pb-28 pt-24">

                        <div className="max-w-[700px]">

                            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[var(--border)] gth-glass px-5 py-3">

                                <Stars
                                    size={14}
                                    className="gold-text"
                                />

                                <span className="text-[10px] tracking-[0.32em] text-[var(--text-soft)]">
                                    GTH AI GLOBAL ECOSYSTEM
                                </span>

                            </div>

                            <h1 className="max-w-[8ch] text-[78px] font-light leading-[0.84] tracking-[-0.08em] text-[var(--text)]">

                                {slides[current].title}

                            </h1>

                            <p className="mt-7 max-w-[56ch] text-[15px] leading-8 text-[var(--text-soft)]">

                                {slides[current].subtitle}

                            </p>

                            {/* CTA */}
                            <div className="mt-10 flex items-center gap-4">

                                <Link
                                    href="/hotels"
                                    className="gth-btn-gold flex h-14 items-center gap-2 rounded-full px-8 text-[10px] font-black tracking-[0.24em]"
                                >

                                    Explore Platform

                                    <ArrowRight size={14} />

                                </Link>

                                <Link
                                    href="/contact"
                                    className="gth-glass flex h-14 items-center rounded-full border border-[var(--border)] px-8 text-[10px] font-black tracking-[0.24em] text-[var(--text)]"
                                >

                                    Enterprise Access

                                </Link>

                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-1 items-center justify-end pr-10 pb-28 pt-45">

                        <div className="w-full max-w-[390px] rounded-[34px] border border-[var(--border)] gth-glass p-5">

                            <div className="mb-5 flex items-center justify-between">

                                <div>

                                    <p className="text-[10px] tracking-[0.3em] text-[var(--text-soft)]">
                                        AI TRAVEL ENGINE
                                    </p>

                                    <h3 className="mt-2 text-[30px] font-light tracking-[-0.05em] text-[var(--text)]">
                                        Smart Planner
                                    </h3>

                                </div>

                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/10">

                                    <Sparkles
                                        size={17}
                                        className="gold-text"
                                    />

                                </div>

                            </div>

                            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg)]/10 p-4">

                                <TripPlanner />

                            </div>

                        </div>

                    </div>

                </div>

                {/* MOBILE */}
                <div className="relative z-30 flex h-full flex-col justify-between px-4 pb-[230px] pt-[138px] xl:hidden">

                    {/* CONTENT */}
                    <div>

                        <div className="inline-flex items-center rounded-full border border-[var(--border)] gth-glass px-4 py-2">

                            <span className="text-[9px] tracking-[0.28em] text-[var(--text-soft)]">
                                GTH AI ECOSYSTEM
                            </span>

                        </div>

                        <h1 className="mt-5 max-w-[8ch] text-[52px] font-light leading-[0.9] tracking-[-0.07em] text-[var(--text)]">

                            {slides[current].title}

                        </h1>

                        <p className="mt-5 max-w-[95%] text-[14px] leading-7 text-[var(--text-soft)]">

                            {slides[current].subtitle}

                        </p>

                        {/* CTA */}
                        <div className="mt-8 flex flex-wrap gap-3">

                            <Link
                                href="/hotels"
                                className="gth-btn-gold flex h-12 items-center rounded-full px-6 text-[10px] font-black tracking-[0.18em]"
                            >

                                Explore

                            </Link>

                            <Link
                                href="/contact"
                                className="gth-glass flex h-12 items-center rounded-full border border-[var(--border)] px-6 text-[10px] font-black tracking-[0.18em] text-[var(--text)]"
                            >

                                Access

                            </Link>

                        </div>

                    </div>

                    {/* MOBILE PLANNER */}
                    <div className="mt-10 rounded-[28px] border border-[var(--border)] gth-glass p-4">

                        <div className="mb-4 flex items-center justify-between">

                            <div>

                                <p className="text-[9px] tracking-[0.24em] text-[var(--text-soft)]">
                                    AI JOURNEY ENGINE
                                </p>

                                <h3 className="mt-2 text-[24px] font-light tracking-[-0.04em] text-[var(--text)]">
                                    Smart Planner
                                </h3>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]/10">

                                <Sparkles
                                    size={16}
                                    className="gold-text"
                                />

                            </div>

                        </div>

                        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg)]/10 p-3">

                            <TripPlanner />

                        </div>

                    </div>

                </div>

                {/* SEARCH BAR */}
                <div className="absolute bottom-5 left-1/2 z-40 w-[94%] -translate-x-1/2 xl:bottom-7 xl:max-w-[1220px]">

                    <div className="rounded-[30px] border border-[var(--border)] gth-glass p-3">

                        <div className="flex flex-col gap-3 xl:flex-row">

                            {/* SEARCH */}
                            <div className="flex h-[65px] flex-[1.6] items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--bg)]/10 px-5">

                                <Search
                                    size={16}
                                    className="text-[var(--text-soft)]"
                                />

                                <input
                                    placeholder="Search stays, flights, destinations & experiences..."
                                    className="h-full w-full bg-transparent text-sm text-[var(--text)] outline placeholder:text-[var(--text-soft)]"
                                />

                            </div>

                            {/* DATES */}
                            <div className="grid grid-cols-2 gap-3 xl:flex">

                                <input
                                    type="date"
                                    className="h-[68px] min-w-[160px] rounded-[22px] border border-[var(--border)] bg-[var(--bg)]/10 px-4 text-sm text-[var(--text-soft)] outline-none"
                                />

                                <input
                                    type="date"
                                    className="h-[68px] min-w-[160px] rounded-[22px] border border-[var(--border)] bg-[var(--bg)]/10 px-4 text-sm text-[var(--text-soft)] outline-none"
                                />

                            </div>

                            {/* CTA */}
                            <button className="gth-btn-gold h-[68px] rounded-[22px] px-8 text-[10px] font-black tracking-[0.24em] whitespace-nowrap">

                                Search Inventory

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </section>

    )

}