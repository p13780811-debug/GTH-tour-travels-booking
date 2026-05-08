"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Search,
    Menu,
    X,
    ChevronRight,
    Sparkles,
    Crown,
    Globe,
    Building2,
    Compass,
    Plane,
    ShieldCheck,
} from "lucide-react"

import SearchBox from "@/components/SearchBox"

export default function Navbar() {

    const pathname = usePathname()

    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {

        const handleScroll = () => {
            setScrolled(window.scrollY > 12)
        }

        window.addEventListener("scroll", handleScroll)

        return () =>
            window.removeEventListener("scroll", handleScroll)

    }, [])

    const navItems = [
        {
            name: "Destinations",
            href: "/destinations",
            icon: Globe,
        },
        {
            name: "Hotels",
            href: "/hotels",
            icon: Plane,
        },
        {
            name: "Real Estate",
            href: "/real-estate",
            icon: Building2,
        },
        {
            name: "Tender",
            href: "/tender",
            icon: ShieldCheck,
        },
        {
            name: "Guides",
            href: "/guides",
            icon: Compass,
        },
        {
            name: "Contact",
            href: "/contact",
            icon: Sparkles,
        },
    ]

    return (

        <>

            {/* ======================================== */}
            {/* PREMIUM TOP STRIP */}
            {/* ======================================== */}

            <div className="relative z-[70] border-b border-[var(--border)] bg-black/30 backdrop-blur-3xl">

                <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 overflow-x-auto px-4 py-2 scrollbar-hide">

                    <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">

                        <Sparkles size={12} />

                        AI Powered Platform

                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">

                        <Crown size={12} />

                        Luxury Experience

                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">

                        <ShieldCheck size={12} />

                        Verified Ecosystem

                    </div>

                </div>

            </div>

            {/* ======================================== */}
            {/* MAIN NAVBAR */}
            {/* ======================================== */}

            <nav className={`sticky top-0 z-[60] transition-all duration-500 ${scrolled
                ? "border-b border-[var(--border)] bg-[var(--card)]/80 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-3xl"
                : "bg-transparent"
                }`}>

                {/* ======================================== */}
                {/* BACKGROUND FX */}
                {/* ======================================== */}

                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                    <div className="absolute left-0 top-[-100px] h-[220px] w-[220px] rounded-full bg-cyan-500/10 blur-3xl" />

                    <div className="absolute right-0 top-[-120px] h-[260px] w-[260px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                </div>

                {/* ======================================== */}
                {/* NAV CONTAINER */}
                {/* ======================================== */}

                <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">

                    {/* ======================================== */}
                    {/* LOGO */}
                    {/* ======================================== */}

                    <Link
                        href="/"
                        className="group relative flex items-center gap-4"
                    >

                        {/* glow */}
                        <div className="absolute inset-0 rounded-full bg-[#d4af37]/10 opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-100" />

                        {/* logo */}
                        <div className="relative">

                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] opacity-40 blur-xl transition-all duration-700 group-hover:scale-125" />

                            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#d4af37]/40 bg-black shadow-[0_10px_40px_rgba(212,175,55,0.2)]">

                                <img
                                    src="/images/gth-logo.png"
                                    alt="GTH PRO"
                                    className="h-full w-full object-cover scale-110 transition-all duration-700 group-hover:scale-125 group-hover:rotate-6"
                                />

                            </div>

                        </div>

                        {/* text */}
                        <div className="leading-none">

                            <div className="flex items-center gap-2">

                                <span className="text-xl font-black tracking-tight text-[var(--text)]">
                                    GTH
                                </span>

                                <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-xl font-black tracking-tight text-transparent">
                                    PRO
                                </span>

                            </div>

                            <div className="mt-1 flex items-center gap-2">

                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(0,255,150,0.8)]" />

                                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[var(--muted)]">
                                    Global Intelligence Platform
                                </span>

                            </div>

                        </div>

                    </Link>

                    {/* ======================================== */}
                    {/* CENTER SEARCH */}
                    {/* ======================================== */}

                    <div className="hidden xl:flex flex-1 justify-center px-8">

                        <div className="relative w-full max-w-md">

                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-[#d4af37]/10 to-cyan-500/10 blur-2xl" />

                            <div className="relative rounded-full border border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-3xl">

                                <SearchBox />

                            </div>

                        </div>

                    </div>

                    {/* ======================================== */}
                    {/* DESKTOP NAV */}
                    {/* ======================================== */}

                    <div className="hidden items-center gap-1 lg:flex">

                        {navItems.map((item: any) => {

                            const Icon = item.icon

                            const active =
                                pathname === item.href

                            return (

                                <div
                                    key={item.href}
                                    className="group relative"
                                >

                                    <Link
                                        href={item.href}
                                        className={`relative flex items-center gap-2 overflow-hidden rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-500 ${active
                                            ? "bg-gradient-to-r from-[#bf953f]/20 via-[#fcf6ba]/10 to-[#b38728]/20 text-[#d4af37] shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
                                            : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]"
                                            }`}
                                    >

                                        <div className={`absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 ${active
                                            ? "bg-gradient-to-r from-[#bf953f]/10 to-[#b38728]/10"
                                            : "bg-white/[0.03]"
                                            }`} />

                                        <Icon
                                            size={14}
                                            className="relative z-10"
                                        />

                                        <span className="relative z-10">
                                            {item.name}
                                        </span>

                                    </Link>

                                    {/* ======================================== */}
                                    {/* MEGA MENU */}
                                    {/* ======================================== */}

                                    {(item.name === "Destinations" ||
                                        item.name === "Real Estate") && (

                                            <div className="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-6 w-[880px] -translate-x-1/2 opacity-0 transition-all duration-500 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">

                                                <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[var(--card)]/85 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-3xl">

                                                    {/* bg fx */}
                                                    <div className="pointer-events-none absolute inset-0 overflow-hidden">

                                                        <div className="absolute right-[-80px] top-[-80px] h-[240px] w-[240px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                                                        <div className="absolute bottom-[-100px] left-[-80px] h-[220px] w-[220px] rounded-full bg-cyan-500/10 blur-3xl" />

                                                    </div>

                                                    <div className="relative grid grid-cols-3 gap-8">

                                                        {/* left */}
                                                        <div className="col-span-1 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">

                                                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">

                                                                <Sparkles size={12} />

                                                                Premium Access

                                                            </div>

                                                            <h3 className="text-2xl font-black leading-tight text-[var(--text)]">

                                                                Explore the next
                                                                generation
                                                                platform

                                                            </h3>

                                                            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">

                                                                Discover premium
                                                                destinations,
                                                                intelligent real
                                                                estate and luxury
                                                                lifestyle
                                                                services.

                                                            </p>

                                                        </div>

                                                        {/* links */}
                                                        <div className="col-span-2 grid grid-cols-2 gap-4">

                                                            {(item.name === "Destinations"
                                                                ? [
                                                                    "Goa",
                                                                    "Dubai",
                                                                    "Bali",
                                                                    "Paris",
                                                                    "Manali",
                                                                    "Jaipur",
                                                                    "Thailand",
                                                                    "Singapore",
                                                                ]
                                                                : [
                                                                    "Buy Property",
                                                                    "Rent Homes",
                                                                    "Luxury Villas",
                                                                    "Commercial",
                                                                    "Plots",
                                                                    "New Launch",
                                                                    "Smart Homes",
                                                                    "Investment Deals",
                                                                ]).map((x) => (

                                                                    <Link
                                                                        key={x}
                                                                        href={item.name === "Destinations"
                                                                            ? `/destinations/${x.toLowerCase().replace(/\s/g, "-")}`
                                                                            : `/real-estate`}
                                                                        className="group/item relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]/20 hover:bg-[#d4af37]/[0.05]"
                                                                    >

                                                                        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/5 to-cyan-500/0 opacity-0 transition-all duration-700 group-hover/item:opacity-100" />

                                                                        <div className="relative flex items-center justify-between">

                                                                            <div>

                                                                                <p className="text-sm font-black tracking-wide text-[var(--text)]">

                                                                                    {x}

                                                                                </p>

                                                                                <p className="mt-2 text-xs text-[var(--muted)]">

                                                                                    Explore premium listings

                                                                                </p>

                                                                            </div>

                                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 transition-all duration-500 group-hover/item:translate-x-1 group-hover/item:border-[#d4af37]/20">

                                                                                <ChevronRight
                                                                                    size={16}
                                                                                    className="text-[#d4af37]"
                                                                                />

                                                                            </div>

                                                                        </div>

                                                                    </Link>

                                                                ))}

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        )}

                                </div>

                            )

                        })}

                    </div>

                    {/* ======================================== */}
                    {/* CTA */}
                    {/* ======================================== */}

                    <div className="hidden items-center gap-3 md:flex">

                        <Link
                            href="/real-estate"
                            className="group relative overflow-hidden rounded-full border border-[#d4af37]/30 px-6 py-3"
                        >

                            <div className="absolute inset-0 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]" />

                            <div className="absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 bg-white/20" />

                            <div className="relative flex items-center gap-2">

                                <Crown
                                    size={15}
                                    className="text-black"
                                />

                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black">

                                    Explore Luxury

                                </span>

                            </div>

                        </Link>

                    </div>

                    {/* ======================================== */}
                    {/* MOBILE MENU BTN */}
                    {/* ======================================== */}

                    <button
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--text)] backdrop-blur-2xl transition-all duration-500 hover:scale-105 md:hidden"
                    >

                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-[#d4af37]/10" />

                        {menuOpen
                            ? <X size={20} className="relative z-10" />
                            : <Menu size={20} className="relative z-10" />}

                    </button>

                </div>

            </nav>

            {/* ======================================== */}
            {/* MOBILE FULLSCREEN MENU */}
            {/* ======================================== */}

            <div className={`fixed inset-0 z-[100] transition-all duration-700 md:hidden ${menuOpen
                ? "visible opacity-100"
                : "invisible opacity-0"
                }`}>

                {/* bg */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />

                {/* glow */}
                <div className="absolute left-[-100px] top-[-100px] h-[260px] w-[260px] rounded-full bg-cyan-500/20 blur-3xl" />

                <div className="absolute bottom-[-120px] right-[-100px] h-[280px] w-[280px] rounded-full bg-[#d4af37]/20 blur-3xl" />

                {/* content */}
                <div className="relative flex h-full flex-col overflow-y-auto p-6">

                    {/* top */}
                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">

                                GTH PRO

                            </p>

                            <h2 className="mt-2 text-3xl font-black text-white">

                                Navigation Hub

                            </h2>

                        </div>

                        <button
                            onClick={() =>
                                setMenuOpen(false)
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                        >

                            <X
                                size={20}
                                className="text-white"
                            />

                        </button>

                    </div>

                    {/* search */}
                    <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-2xl">

                        <SearchBox />

                    </div>

                    {/* nav */}
                    <div className="mt-8 space-y-3">

                        {navItems.map((item: any) => {

                            const Icon = item.icon

                            const active =
                                pathname === item.href

                            return (

                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() =>
                                        setMenuOpen(false)
                                    }
                                    className={`group flex items-center justify-between overflow-hidden rounded-[26px] border p-5 transition-all duration-500 ${active
                                        ? "border-[#d4af37]/30 bg-[#d4af37]/10"
                                        : "border-white/10 bg-white/[0.03]"
                                        }`}
                                >

                                    <div className="flex items-center gap-4">

                                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${active
                                            ? "bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black"
                                            : "border border-white/10 bg-black/20 text-white"
                                            }`}>

                                            <Icon size={22} />

                                        </div>

                                        <div>

                                            <p className={`text-base font-black ${active
                                                ? "text-[#d4af37]"
                                                : "text-white"
                                                }`}>

                                                {item.name}

                                            </p>

                                            <p className="mt-1 text-xs text-[var(--muted)]">

                                                Explore premium ecosystem

                                            </p>

                                        </div>

                                    </div>

                                    <ChevronRight
                                        size={18}
                                        className={`${active
                                            ? "text-[#d4af37]"
                                            : "text-white/40"
                                            }`}
                                    />

                                </Link>

                            )

                        })}

                    </div>

                    {/* bottom */}
                    <div className="mt-auto pt-10">

                        <Link
                            href="/real-estate"
                            onClick={() =>
                                setMenuOpen(false)
                            }
                            className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-[26px] border border-[#d4af37]/20 py-5"
                        >

                            <div className="absolute inset-0 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]" />

                            <div className="relative flex items-center gap-3">

                                <Crown
                                    size={18}
                                    className="text-black"
                                />

                                <span className="text-sm font-black uppercase tracking-[0.25em] text-black">

                                    Explore Premium Real Estate

                                </span>

                            </div>

                        </Link>

                    </div>

                </div>

            </div>

        </>

    )

}