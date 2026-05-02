"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import SearchBox from "@/components/SearchBox"

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()

    const navItems = [
        { name: "Destinations", href: "/destinations" },
        { name: "Hotels", href: "/hotels" },
        { name: "Real Estate", href: "/real-estate" },
        { name: "Tender", href: "/tender" },
        { name: "Guides", href: "/guides" },
        { name: "Contact", href: "/contact" },
    ]

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">

            {/* MAIN BAR */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-11 w-11 rounded-full overflow-hidden border border-yellow-500/40">
                        <img
                            src="/images/gth-logo.png"
                            className="h-full w-full object-cover scale-110 group-hover:scale-125 transition"
                        />
                    </div>

                    <div className="leading-none">
                        <div className="flex gap-1">
                            <span className="text-white font-bold">GTH</span>
                            <span className="text-yellow-400 font-bold">PRO</span>
                        </div>
                        <span className="text-[8px] text-gray-500 uppercase tracking-widest">
                            Global Platform
                        </span>
                    </div>
                </Link>

                {/* SEARCH */}
                <div className="hidden lg:block w-72">
                    <SearchBox />
                </div>

                {/* DESKTOP NAV */}
                <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider">

                    {navItems.map((item) => (
                        <div key={item.href} className="relative group">

                            <Link
                                href={item.href}
                                className={`pb-1 transition ${pathname === item.href
                                        ? "text-yellow-400 border-b border-yellow-400/50"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                {item.name}
                            </Link>

                            {/* 🔥 MEGA MENU (ONLY FOR MAIN SECTIONS) */}
                            {(item.name === "Destinations" || item.name === "Real Estate") && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[700px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">

                                    <div className="gth-glass p-6 grid grid-cols-3 gap-6">

                                        {item.name === "Destinations" && (
                                            <>
                                                <Link href="/destinations/goa">Goa</Link>
                                                <Link href="/destinations/dubai">Dubai</Link>
                                                <Link href="/destinations/manali">Manali</Link>
                                                <Link href="/destinations/jaipur">Jaipur</Link>
                                                <Link href="/destinations/bali">Bali</Link>
                                                <Link href="/destinations/paris">Paris</Link>
                                            </>
                                        )}

                                        {item.name === "Real Estate" && (
                                            <>
                                                <Link href="/real-estate?type=buy">Buy Property</Link>
                                                <Link href="/real-estate?type=rent">Rent Property</Link>
                                                <Link href="/real-estate?type=luxury">Luxury Homes</Link>
                                                <Link href="/real-estate?type=commercial">Commercial</Link>
                                                <Link href="/real-estate?type=plots">Plots</Link>
                                                <Link href="/real-estate?type=new">New Launch</Link>
                                            </>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                </div>

                {/* CTA */}
                <Link
                    href="/real-estate"
                    className="hidden md:block px-5 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]"
                >
                    Explore
                </Link>

                {/* MOBILE BTN */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden text-white text-xl"
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* 📱 MOBILE FULLSCREEN MENU */}
            {menuOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col p-6">

                    <div className="flex justify-between items-center mb-6">
                        <span className="text-white font-bold">Menu</span>
                        <button onClick={() => setMenuOpen(false)}>✕</button>
                    </div>

                    <SearchBox />

                    <div className="flex flex-col gap-5 mt-6 text-lg">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`${pathname === item.href
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                </div>
            )}
        </nav>
    )
}