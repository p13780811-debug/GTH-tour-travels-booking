import LuxuryCard from "@/components/cards/LuxuryCard"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function DestinationsPage() {

    const { data: destinations } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true)

    return (
        <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto mb-16">

                <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter">
                    GTH <span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">Luxury</span>
                </h1>

                <div className="flex items-center gap-3 mt-2">
                    <div className="w-12 h-[2px] gth-btn-gold"></div>

                    <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-sm">
                        Premium Travel Tenders & Destinations
                    </p>

                </div>

            </div>

            {/* Card Grid */}

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                {destinations?.map((city: any) => (

                    <LuxuryCard
                        key={city.id}
                        title={city.name}
                        description={city.description}
                        price={city.price || "4,999"}
                        image={
                            city.image_url ||
                            `https://images.unsplash.com/photo-1602002418082-7a92f3d3f0f2?auto=format&fit=crop&w=800&q=80`
                        }
                        slug={city.name.toLowerCase()}
                    />

                ))}

            </div>

        </main>
    )
}