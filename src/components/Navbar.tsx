"use client"

import { useEffect, useMemo, useState } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Search,
    Menu,
    X,
    Sparkles,
    Crown,
    Globe,
    Building2,
    Compass,
    Plane,
    ShieldCheck,
    BadgeCheck,
    ChevronRight,
    ArrowUpRight,
    Gem,
    MapPinned,
    Hotel,
    BriefcaseBusiness,
    Headphones,
    BellRing,
    Orbit,
} from "lucide-react"

import SearchBox from "@/components/SearchBox"
import ThemeToggle from "@/components/ThemeToggle"

export default function Navbar() {

    const pathname = usePathname()

    const [menuOpen, setMenuOpen] = useState(false)

    const [scrolled, setScrolled] = useState(false)

    const [hoveredMenu, setHoveredMenu] =
        useState<string | null>(null)

    // =====================================================
    // SCROLL
    // =====================================================

    useEffect(() => {

        const handleScroll = () => {

            setScrolled(window.scrollY > 10)

        }

        window.addEventListener(
            "scroll",
            handleScroll
        )

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            )

    }, [])

    // =====================================================
    // BODY LOCK
    // =====================================================

    useEffect(() => {

        document.body.style.overflow =
            menuOpen
                ? "hidden"
                : "auto"

        return () => {

            document.body.style.overflow =
                "auto"

        }

    }, [menuOpen])

    // =====================================================
    // NAV ITEMS
    // =====================================================

    const navItems = useMemo(() => [

        {
            name: "Destinations",
            href: "/destinations",
            icon: Globe,
            mega: true,
            featured: [
                "Dubai",
                "Bali",
                "Maldives",
                "Goa",
            ],
        },

        {
            name: "Hotels",
            href: "/hotels",
            icon: Hotel,
            mega: false,
        },

        {
            name: "Real Estate",
            href: "/real-estate",
            icon: Building2,
            mega: true,
            featured: [
                "Luxury Villas",
                "Commercial",
                "Penthouses",
                "Smart Homes",
            ],
        },

        {
            name: "Tender",
            href: "/tender",
            icon: ShieldCheck,
            mega: false,
        },

        {
            name: "Guides",
            href: "/guides",
            icon: Compass,
            mega: false,
        },

    ], [])

    return (

        <>

            {/* ================================================= */}
            {/* TOP STRIP */}
            {/* ================================================= */}

            <div className="relative z-[120] border-b border-[var(--border)] bg-[var(--card-strong)]/80 backdrop-blur-[40px]">

                <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 overflow-x-auto px-4 py-2 scrollbar-hide lg:px-8">

                    {/* left */}

                    <div className="flex items-center gap-2 whitespace-nowrap">

                        <div className="gth-glass flex items-center gap-2 rounded-full px-3 py-2">

                            <Sparkles
                                size={11}
                                className="text-[var(--primary)]"
                            />

                            <span className="gth-nav-mini">
                                AI Powered
                            </span>

                        </div>

                        <div className="gth-glass flex items-center gap-2 rounded-full px-3 py-2">

                            <Gem
                                size={11}
                                className="text-[var(--gold)]"
                            />

                            <span className="gth-nav-mini">
                                Luxury Ecosystem
                            </span>

                        </div>

                        <div className="gth-glass hidden items-center gap-2 rounded-full px-3 py-2 md:flex">

                            <BadgeCheck
                                size={11}
                                className="text-emerald-400"
                            />

                            <span className="gth-nav-mini">
                                Verified
                            </span>

                        </div>

                    </div>

                    {/* right */}

                    <div className="hidden items-center gap-2 xl:flex">

                        <div className="gth-glass flex items-center gap-2 rounded-full px-3 py-2">

                            <Orbit
                                size={11}
                                className="text-[var(--primary)]"
                            />

                            <span className="gth-nav-mini">
                                Global Network
                            </span>

                        </div>

                        <div className="gth-glass flex items-center gap-2 rounded-full px-3 py-2">

                            <BellRing
                                size={11}
                                className="text-[var(--gold)]"
                            />

                            <span className="gth-nav-mini">
                                Live Intelligence
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* NAVBAR */}
            {/* ================================================= */}

            <nav className={`
                sticky
                top-0
                z-[110]
                border-b
                border-[var(--border)]
                transition-all
                duration-500

                ${scrolled
                    ? `
                        bg-[var(--card-strong)]/88
                        shadow-[var(--shadow)]
                        backdrop-blur-[40px]
                    `
                    : `
                        bg-[var(--card)]/65
                        backdrop-blur-[24px]
                    `
                }
            `}>

                {/* bg fx */}

                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                    <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-[var(--primary)]/10 blur-3xl" />

                    <div className="absolute right-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                </div>

                {/* container */}

                <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-8">

                    {/* ================================================= */}
                    {/* LOGO */}
                    {/* ================================================= */}

                    <Link
                        href="/"
                        className="group relative flex shrink-0 items-center gap-3"
                    >

                        {/* glow */}

                        <div className="absolute inset-0 rounded-full bg-[var(--gold)]/10 opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-100" />

                        {/* image */}

                        <div className="gth-glass-ultra relative h-12 w-12 overflow-hidden rounded-full border border-[var(--gold)]/20">

                            <img
                                src="/images/gth-logo.png"
                                alt="GTH"
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                    scale-110
                                    transition-all
                                    duration-700
                                    group-hover:scale-125
                                    group-hover:rotate-6
                                "
                            />

                        </div>

                        {/* text */}

                        <div className="flex flex-col justify-center leading-none">

                            <div className="flex items-center gap-1">

                                <span className="gth-logo-text text-[var(--text)]">

                                    GTH

                                </span>

                                <span className="gth-logo-text gold-text">

                                    PRO

                                </span>

                            </div>

                            <div className="mt-1 flex items-center gap-2">

                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,1)]" />

                                <span className="gth-logo-sub">

                                    Global Platform

                                </span>

                            </div>

                        </div>

                    </Link>

                    {/* ================================================= */}
                    {/* SEARCH */}
                    {/* ================================================= */}

                    <div className="hidden flex-1 items-center justify-center xl:flex">

                        <div className="relative w-full max-w-xl">

                            <div className="absolute inset-0 rounded-full bg-[var(--gold)]/10 blur-3xl" />

                            <div className="gth-glass-ultra relative overflow-hidden rounded-full border border-[var(--border)]">

                                <div className="absolute left-5 top-1/2 z-20 -translate-y-1/2 text-[var(--muted)]">

                                    <Search size={14} />

                                </div>

                                <SearchBox />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* DESKTOP NAV */}
                    {/* ================================================= */}

                    <div className="hidden items-center gap-2 lg:flex">

                        {navItems.map((item: any) => {

                            const Icon =
                                item.icon

                            const active =
                                pathname === item.href

                            return (

                                <div
                                    key={item.href}
                                    className="group relative"
                                    onMouseEnter={() =>
                                        setHoveredMenu(item.name)
                                    }
                                    onMouseLeave={() =>
                                        setHoveredMenu(null)
                                    }
                                >

                                    {/* nav button */}

                                    <Link
                                        href={item.href}
                                        className={`
                                            flex
                                            items-center
                                            gap-2
                                            rounded-full
                                            px-4
                                            py-2.5
                                            transition-all
                                            duration-500

                                            ${active
                                                ? `
                                                    gth-btn-gold
                                                    scale-105
                                                `
                                                : `
                                                    gth-glass
                                                    text-[var(--text)]
                                                    hover:scale-105
                                                `
                                            }
                                        `}
                                    >

                                        <Icon size={13} />

                                        <span className="gth-nav-text">

                                            {item.name}

                                        </span>

                                    </Link>

                                    {/* mega */}

                                    {item.mega && (

                                        <div className={`
                                            absolute
                                            left-1/2
                                            top-full
                                            z-[150]
                                            mt-5
                                            w-[760px]
                                            -translate-x-1/2
                                            transition-all
                                            duration-500

                                            ${hoveredMenu === item.name
                                                ? `
                                                    visible
                                                    opacity-100
                                                    translate-y-0
                                                `
                                                : `
                                                    invisible
                                                    opacity-0
                                                    translate-y-4
                                                `
                                            }
                                        `}>

                                            <div className="gth-glass-ultra overflow-hidden rounded-[32px] border border-[var(--border)] p-6 shadow-[var(--shadow)]">

                                                {/* bg */}

                                                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                                                    <div className="absolute right-[-80px] top-[-80px] h-[200px] w-[200px] rounded-full bg-[var(--gold)]/10 blur-3xl" />

                                                    <div className="absolute bottom-[-80px] left-[-80px] h-[200px] w-[200px] rounded-full bg-[var(--primary)]/10 blur-3xl" />

                                                </div>

                                                <div className="relative grid grid-cols-3 gap-5">

                                                    {/* left */}

                                                    <div className="gth-grid-luxury rounded-[26px] p-5">

                                                        <div className="gth-btn-gold inline-flex items-center gap-2 rounded-full px-3 py-2">

                                                            <Sparkles size={11} />

                                                            <span className="gth-nav-mini text-black">

                                                                Premium

                                                            </span>

                                                        </div>

                                                        <h3 className="mt-5 text-xl font-black leading-tight text-[var(--text)]">

                                                            Luxury
                                                            Experience

                                                        </h3>

                                                        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">

                                                            Premium travel,
                                                            investment and
                                                            global real estate
                                                            ecosystem.

                                                        </p>

                                                        <Link
                                                            href={item.href}
                                                            className="gth-btn mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2"
                                                        >

                                                            <span className="gth-nav-mini">

                                                                Explore

                                                            </span>

                                                            <ArrowUpRight
                                                                size={13}
                                                            />

                                                        </Link>

                                                    </div>

                                                    {/* right */}

                                                    <div className="col-span-2 grid grid-cols-2 gap-4">

                                                        {item.featured.map((x: string) => (

                                                            <Link
                                                                key={x}
                                                                href={item.href}
                                                                className="
                                                                    gth-glass
                                                                    group/item
                                                                    rounded-[24px]
                                                                    p-5
                                                                    transition-all
                                                                    duration-500
                                                                    hover:-translate-y-1
                                                                "
                                                            >

                                                                <div className="flex items-start justify-between gap-4">

                                                                    <div>

                                                                        <div className="gth-btn-gold mb-4 flex h-10 w-10 items-center justify-center rounded-2xl">

                                                                            {item.name === "Destinations"
                                                                                ? <MapPinned size={16} />
                                                                                : <Building2 size={16} />
                                                                            }

                                                                        </div>

                                                                        <h4 className="text-sm font-black text-[var(--text)]">

                                                                            {x}

                                                                        </h4>

                                                                        <p className="mt-2 text-xs text-black leading-relaxed text-[var(--muted)]">

                                                                            Explore premium listings.

                                                                        </p>

                                                                    </div>

                                                                    <ChevronRight
                                                                        size={15}
                                                                        className="text-[var(--gold)] transition-all duration-500 group-hover/item:translate-x-1"
                                                                    />

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

                    {/* ================================================= */}
                    {/* RIGHT */}
                    {/* ================================================= */}

                    <div className="flex shrink-0 items-center gap-2">

                        <ThemeToggle />

                        <Link
                            href="/real-estate"
                            className="
                                gth-btn-gold
                                hidden
                                items-center
                                gap-2
                                rounded-full
                                px-5
                                py-2.5
                                xl:flex
                            "
                        >

                            <Crown size={14} />

                            <span className="gth-nav-mini text-black">

                                Premium Access

                            </span>

                        </Link>

                        {/* mobile */}

                        <button
                            onClick={() =>
                                setMenuOpen(!menuOpen)
                            }
                            className="
                                gth-glass-ultra
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-2xl
                                transition-all
                                duration-500
                                hover:scale-105
                                lg:hidden
                            "
                        >

                            {menuOpen
                                ? (
                                    <X
                                        size={18}
                                        className="text-[var(--text)]"
                                    />
                                )
                                : (
                                    <Menu
                                        size={18}
                                        className="text-[var(--text)]"
                                    />
                                )
                            }

                        </button>

                    </div>

                </div>

            </nav>

            {/* ================================================= */}
            {/* MOBILE MENU */}
            {/* ================================================= */}

            <div className={`
                fixed
                inset-0
                z-[200]
                transition-all
                duration-500
                lg:hidden

                ${menuOpen
                    ? `
                        visible
                        opacity-100
                    `
                    : `
                        invisible
                        opacity-0
                    `
                }
            `}>

                {/* bg */}

                <div className="absolute inset-0 bg-[var(--bg)]/96 backdrop-blur-[40px]" />

                {/* fx */}

                <div className="absolute left-[-100px] top-[-100px] h-[220px] w-[220px] rounded-full bg-[var(--primary)]/20 blur-3xl" />

                <div className="absolute bottom-[-100px] right-[-100px] h-[220px] w-[220px] rounded-full bg-[var(--gold)]/20 blur-3xl" />

                {/* content */}

                <div className="relative flex h-full flex-col overflow-y-auto p-5">

                    {/* top */}

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="gth-nav-mini text-[var(--primary)]">

                                GTH PRO

                            </p>

                            <h2 className="mt-2 text-3xl font-black text-[var(--text)]">

                                Navigation

                            </h2>

                        </div>

                        <button
                            onClick={() =>
                                setMenuOpen(false)
                            }
                            className="gth-glass-ultra flex h-11 w-11 items-center justify-center rounded-2xl"
                        >

                            <X
                                size={18}
                                className="text-[var(--text)]"
                            />

                        </button>

                    </div>

                    {/* search */}

                    <div className="gth-glass-ultra mt-6 rounded-[24px] p-3">

                        <SearchBox />

                    </div>

                    {/* nav items */}

                    <div className="mt-6 space-y-3">

                        {navItems.map((item: any) => {

                            const Icon =
                                item.icon

                            const active =
                                pathname === item.href

                            return (

                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() =>
                                        setMenuOpen(false)
                                    }
                                    className="
                                        gth-glass-ultra
                                        flex
                                        items-center
                                        justify-between
                                        rounded-[26px]
                                        p-4
                                        transition-all
                                        duration-500
                                        hover:translate-x-1
                                    "
                                >

                                    <div className="flex items-center gap-4">

                                        <div className={`
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-2xl

                                            ${active
                                                ? `
                                                    gth-btn-gold
                                                    text-black
                                                `
                                                : `
                                                    gth-glass
                                                    text-[var(--text)]
                                                `
                                            }
                                        `}>

                                            <Icon size={18} />

                                        </div>

                                        <div>

                                            <p className={`
                                                text-sm
                                                font-black

                                                ${active
                                                    ? `
                                                        text-[var(--gold)]
                                                    `
                                                    : `
                                                        text-[var(--text)]
                                                    `
                                                }
                                            `}>

                                                {item.name}

                                            </p>

                                            <p className="mt-1 text-xs text-[var(--muted)]">

                                                Explore ecosystem

                                            </p>

                                        </div>

                                    </div>

                                    <ChevronRight
                                        size={15}
                                        className="text-[var(--gold)]"
                                    />

                                </Link>

                            )

                        })}

                    </div>

                    {/* bottom */}

                    <div className="mt-auto pt-8">

                        <Link
                            href="/real-estate"
                            onClick={() =>
                                setMenuOpen(false)
                            }
                            className="
                                gth-btn-gold
                                flex
                                items-center
                                justify-center
                                gap-2
                                rounded-[24px]
                                px-5
                                py-4
                            "
                        >

                            <Crown
                                size={16}
                                className="text-black"
                            />

                            <span className="gth-nav-mini text-black">

                                Explore Premium Real Estate

                            </span>

                        </Link>

                        {/* cards */}

                        <div className="mt-5 grid grid-cols-2 gap-3">

                            <div className="gth-glass rounded-[22px] p-4">

                                <Headphones
                                    size={16}
                                    className="text-[var(--primary)]"
                                />

                                <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] text-[var(--text)]">

                                    24/7 Support

                                </p>

                            </div>

                            <div className="gth-glass rounded-[22px] p-4">

                                <BriefcaseBusiness
                                    size={16}
                                    className="text-[var(--gold)]"
                                />

                                <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] text-[var(--text)]">

                                    Global Deals

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </>

    )

}