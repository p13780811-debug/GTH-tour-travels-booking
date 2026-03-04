"use client"

import Link from "next/link"

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-lg border-b border-yellow-500/20">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                <Link href="/" className="text-2xl font-bold text-white tracking-wider">
                    GTH <span className="text-yellow-400">Luxury</span>
                </Link>

                <div className="hidden md:flex space-x-8 text-gray-300 font-medium">
                    <Link href="#destinations" className="hover:text-yellow-400 transition">
                        Destinations
                    </Link>
                    <Link href="#" className="hover:text-yellow-400 transition">
                        Hotels
                    </Link>
                    <Link href="#" className="hover:text-yellow-400 transition">
                        Guides
                    </Link>
                    <Link href="#" className="hover:text-yellow-400 transition">
                        Contact
                    </Link>
                </div>

                <Link
                    href="#destinations"
                    className="px-5 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:scale-105 transition"
                >
                    Explore
                </Link>
            </div>
        </nav>
    )
}