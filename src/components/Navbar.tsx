"use client"

import { useState } from "react"
import Link from "next/link"
import SearchBox from "@/components/SearchBox"

export default function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false)
    const [destOpen, setDestOpen] = useState(false)

    return (

        <nav className="sticky top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-lg border-b border-yellow-500/20">

            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* LOGO SECTION */}
                <Link href="/" className="flex items-center gap-3 no-underline group">

                    {/* --- LOGO SECTION --- */}
                    <div className="flex items-center gap-1">
                        {/* Round Logo Container - Ab ye chhota (h-10 w-10) aur perfect circle hai */}
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-yellow-500 bg-black flex items-center justify-center">
                            <img
                                src="/images/gth-logo.png"
                                alt="GTH PRO Luxury Logo"
                                className="h-full w-full object-cover scale-110"  // <-- Scale-110 se wo bahar ka kachra chhup jayega
                                style={{
                                    objectPosition: 'center' // Taaki bird ekdum beech mein rahe
                                }}
                            />
                        </div>

                        {/* LOGO TEXT - Isse Navbar ki motai nahi badhegi */}
                        <div className="flex flex-col leading-none">
                            <div className="flex items-center gap-1">
                                <span className="text-lg font-bold text-white uppercase tracking-tight">GTH</span>
                                <span className="text-lg font-bold text-yellow-500 uppercase tracking-tight">PRO</span>
                            </div>
                            <span className="text-[7px] text-gray-400 tracking-[1.5px] uppercase font-medium">
                                Tour & Travels
                            </span>
                        </div>
                    </div>
                </Link>


                {/* SEARCH */}
                <div className="hidden md:block w-72">
                    <SearchBox />
                </div>

                {/* DESKTOP MENU */}
                <div className="hidden md:flex items-center gap-8 text-gray-300 font-medium">

                    {/* DESTINATION DROPDOWN */}
                    <div className="relative group">

                        <button className="hover:text-yellow-400">
                            Destinations
                        </button>

                        <div className="absolute hidden group-hover:grid grid-cols-2 gap-4 p-6 bg-black border border-yellow-500/20 w-96">

                            <Link href="/destinations/goa" className="flex gap-3">

                                <img src="/goa.jpg" className="w-16 h-16 object-cover rounded" />

                                <span>Goa</span>

                            </Link>

                            <Link href="/destinations/dubai" className="flex gap-3">

                                <img src="/dubai.jpg" className="w-16 h-16 object-cover rounded" />

                                <span>Dubai</span>

                            </Link>

                            <Link href="/destinations/manali" className="flex gap-3">

                                <img src="/manali.jpg" className="w-16 h-16 object-cover rounded" />

                                <span>Manali</span>

                            </Link>

                            <Link href="/destinations/jaipur" className="flex gap-3">

                                <img src="/jaipur.jpg" className="w-16 h-16 object-cover rounded" />

                                <span>Jaipur</span>

                            </Link>

                        </div>

                    </div>

                    <Link href="/hotels" className="hover:text-yellow-400 transition">
                        Hotels
                    </Link>

                    <Link href="/guides" className="hover:text-yellow-400 transition">
                        Guides
                    </Link>

                    <Link href="/owners" className="hover:text-yellow-400 transition">
                        List Your Hotel
                    </Link>

                    <Link href="/contact" className="hover:text-yellow-400 transition">
                        Contact
                    </Link>

                </div>

                {/* EXPLORE BUTTON */}
                <Link
                    href="/destinations"
                    className="hidden md:block px-5 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:scale-105 transition"
                >
                    Explore
                </Link>

                {/* MOBILE HAMBURGER */}
                <button
                    className="md:hidden text-white text-2xl"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    ☰
                </button>

            </div>

            {/* MOBILE MENU */}
            {menuOpen && (

                <div className="md:hidden bg-black border-t border-yellow-500/20 px-6 py-4 space-y-4">

                    <SearchBox />

                    <Link href="/destinations" className="block text-gray-300">
                        Destinations
                    </Link>

                    <Link href="/hotels" className="block text-gray-300">
                        Hotels
                    </Link>

                    <Link href="/guides" className="block text-gray-300">
                        Guides
                    </Link>

                    <Link href="/owners" className="block text-gray-300">
                        List Your Hotel
                    </Link>

                    <Link href="/contact" className="block text-gray-300">
                        Contact
                    </Link>

                </div>

            )}

        </nav>
    )
}