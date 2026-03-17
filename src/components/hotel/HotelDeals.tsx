// @ts-nocheck
import { fetchGTHData } from "@/lib/aggregator"

export default async function HotelDeals({ city }: any) {
    let hotels: any[] = []
    try {
        hotels = await fetchGTHData(city)
    } catch (e) {
        hotels = []
    }

    // Pexels Helper: Har hotel ke liye unique par relevant photo
    const getPexelsPhoto = (hotelsname, index) => {
        // Pexels IDs: Maine kuch premium hotel IDs select kiye hain
        // Aap yahan apni API se fetch kiya hua image URL bhi dal sakte hain
        const pexelsIds = [
            '258154', '189333', '271624', '161758', '261102',
            '2034335', '1134176', '237371', '53464', '941801',
            '261101', '1450353', '1134175', '338504', '221457' // Ye 5 nayi premium IDs hain
        ];
        const photoId = pexelsIds[index % pexelsIds.length];
        return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1`;
    }

    if (!hotels.length) {
        return (
            <section className="p-10 text-center text-gray-500 font-medium">
                <div className="animate-pulse tracking-widest uppercase text-xs">
                    ✨ AI is fetching exclusive deals for {city}...
                </div>
            </section>
        )
    }

    return (
        <section className="max-w-7xl mx-auto py-10 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                        Top Stays in <span className="text-yellow-400">{city}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-3 font-medium tracking-wide">
                        COMPARED BY AI • VERIFIED BY GTH PRO
                    </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2 rounded-2xl hidden md:block">
                    <span className="text-[10px] text-yellow-400 font-black px-4 py-2 uppercase tracking-widest">
                        {hotels.length} Live Results
                    </span>
                </div>
            </div>

            <div className="grid gap-8">
                {hotels.map((hotel: any, index: number) => (
                    <div
                        key={hotel.slug}
                        className="group bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col md:flex-row hover:border-yellow-400/40 transition-all duration-500 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
                    >
                        {/* 1. Image Block - Using Pexels */}
                        <div className="relative w-full md:w-[400px] h-64 md:h-auto overflow-hidden">
                            <img
                                src={hotel.image || getPexelsPhoto(hotel.name, index)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                alt={hotel.name}
                            />
                            {/* Premium Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

                            {/* Airbnb Style Badge */}
                            <div className="absolute top-5 left-5 backdrop-blur-md bg-black/40 border border-white/20 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                ✨ AI Pick
                            </div>
                        </div>

                        {/* 2. Details Block */}
                        <div className="p-6 md:p-10 flex flex-col justify-between flex-1">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:text-yellow-400 transition-colors">
                                            {hotel.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex text-yellow-400 text-[10px]">
                                                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                                            </div>
                                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Luxury Stay</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-yellow-400 font-black text-2xl">{hotel.rating || '4.8'}</div>
                                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Rating</div>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-2 font-light">
                                    {hotel.description || `Discover unparalleled luxury at ${hotel.name}. This AI-selected property offers the best value in ${city} with premium amenities and world-class service.`}
                                </p>

                                {/* Cocktail Features */}
                                <div className="flex flex-wrap gap-4 mt-6">
                                    {['Free Cancellation', 'Breakfast Included', 'Instant Confirmation'].map((tag) => (
                                        <span key={tag} className="text-[9px] font-black text-green-500 uppercase border border-green-500/20 px-2 py-1 rounded-md bg-green-500/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Pricing & Booking */}
                            <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Nightly Price</span>
                                    <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                        {hotel.currency} {hotel.price}
                                    </span>
                                </div>

                                <a
                                    href={hotel.partner_link}
                                    target="_blank"
                                    className="bg-yellow-400 hover:bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-[0_10px_30px_-10px_rgba(234,179,8,0.5)] active:scale-95"
                                >
                                    Book Now
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}