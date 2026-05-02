"use client"
import Link from 'next/link'
import { Home, Plane, Building2, CarFront, Hotel } from 'lucide-react'
import { usePathname } from 'next/navigation'

const MobileNav = () => {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <div className="md:hidden fixed bottom-2 left-1/2 -translate-x-1/2 w-[96%] z-50">

            <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl px-2 py-2 flex justify-between items-center shadow-2xl">

                {/* Home */}
                <Link href="/"
                    className={`flex flex-col items-center gap-[2px] transition active:scale-90
                    ${isActive('/') ? 'text-white' : 'text-white/50'}`}
                >
                    <Home size={18} />
                    <span className="text-[9px] uppercase">Home</span>
                </Link>

                {/* Flights */}
                <Link href="https://aviasales.tpo.lv/KkWURb6L" target="_blank"
                    className="flex flex-col items-center gap-[2px] text-white/50 active:scale-90"
                >
                    <Plane size={18} />
                    <span className="text-[9px] uppercase">Flights</span>
                </Link>

                {/* Center REAL ESTATE (MAIN CTA) */}
                <Link href="/real-estate"
                    className="relative -mt-6 gth-glass p-3 rounded-2xl border-4 border-black shadow-xl active:scale-95 transition"
                >
                    <Building2 size={22} className="text-black" />
                </Link>

                {/* Rentals */}
                <Link href="/rentals"
                    className={`flex flex-col items-center gap-[2px] transition active:scale-90
                    ${isActive('/rentals') ? 'text-white' : 'text-white/50'}`}
                >
                    <CarFront size={18} />
                    <span className="text-[9px] uppercase">Rentals</span>
                </Link>

                {/* Hotels */}
                <Link href="/hotels"
                    className={`flex flex-col items-center gap-[2px] transition active:scale-90
                    ${isActive('/hotels') ? 'text-white' : 'text-white/50'}`}
                >
                    <Hotel size={18} />
                    <span className="text-[9px] uppercase">Hotels</span>
                </Link>

            </div>
        </div>
    )
}

export default MobileNav