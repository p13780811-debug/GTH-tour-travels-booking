"use client"
import Link from 'next/link'
import { Home, Plane, Hotel, Car, Bike } from 'lucide-react'

const MobileNav = () => {
    return (
        // 'bottom-2' karne se ye aur neeche chala jayega
        <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-[98%] z-50">

            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-3 flex justify-around items-center shadow-2xl">

                {/* Home Link */}
                <Link href="/" className="flex flex-col items-center gap-1 text-white/60 active:scale-90 transition">
                    <Home size={20} />
                    <span className="text-[10px] uppercase">Home</span>
                </Link>

                {/* Flights (Ab link kaam karega) */}
                <Link href="https://www.skyscanner.com" target="_blank" className="flex flex-col items-center gap-1 text-white/60">
                    <Plane size={20} />
                    <span className="text-[10px] uppercase">Flights</span>
                </Link>

                {/* Center Hotel (Main Portal) */}
                <Link href="/hotels" className="bg-white p-4 rounded-xl -mt-10 border-4 border-black shadow-xl">
                    <Hotel size={24} className="text-black" />
                </Link>

                {/* Cars (Direct Affiliate Link) */}
                <Link href="https://www.rentalcars.com" target="_blank" className="flex flex-col items-center gap-1 text-white/60">
                    <Car size={20} />
                    <span className="text-[10px] uppercase">Cars</span>
                </Link>

                {/* Bikes */}
                <Link href="/rentals" className="flex flex-col items-center gap-1 text-white/60">
                    <Bike size={20} />
                    <span className="text-[10px] uppercase">Bikes</span>
                </Link>

            </div>
        </div>
    )
}

export default MobileNav