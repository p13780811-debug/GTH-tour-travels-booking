import LuxuryCard from "@/components/cards/LuxuryCard" // Aapka naya component
import { destinations } from "@/data/destinations"   // Aapka existing data

export default function DestinationsPage() {
    return (
        // Deep Dark Theme (Indigo/Black) 
        <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">

            {/* Hero Section for Destinations */}
            <div className="max-w-7xl mx-auto mb-16">
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
                    GTH <span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">Luxury</span>
                </h1>
                <div className="flex items-center gap-3 mt-2">
                    <div className="w-12 h-[2px] bg-yellow-500"></div>
                    <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-sm">
                        Premium Travel Tenders & Destinations
                    </p>
                </div>
            </div>

            {/* 3D-Style Card Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {destinations.map((city: any) => (
                    <LuxuryCard
                        key={city.slug}
                        title={city.name}
                        description={city.description || `Explore luxury stays in ${city.name}`}
                        price={city.price || "4,999"}
                        image={city.image || "/images/placeholder.jpg"}
                        slug={city.slug}
                    />
                ))}
            </div>

            {/* Floating 1% Education Badge  */}
            <div className="fixed bottom-10 right-10 z-50">
                <div className="bg-black/50 backdrop-blur-md border border-yellow-500/30 p-4 rounded-2xl flex items-center gap-3 shadow-2xl">
                    <span className="text-2xl animate-pulse">💛</span>
                    <p className="text-[10px] text-white font-bold leading-tight">
                        1% OF ALL BOOKINGS<br />
                        <span className="text-yellow-500">GO TO EDUCATION FUND</span>
                    </p>
                </div>
            </div>
        </main>
    )
}