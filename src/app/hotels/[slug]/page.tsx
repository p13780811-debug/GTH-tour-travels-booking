import { fetchGTHData } from "@/lib/aggregator";


export default async function HotelPage({ params }: { params: { slug: string } }) {
    // 1. Next.js 15 Fix: Await params
    const { slug } = await params;

    // 2. City name extract karo
    const city = slug.split('-')[0];

    // 3. Travelpayouts se Asli Data mangwao
    let realHotels = [];

    try {
        realHotels = await fetchGTHData(city);
    } catch (e) {
        console.log("Travel API failed, fallback mode active");
    }

    if (!realHotels || realHotels.length === 0) {
        return (
            <div className="bg-black text-white min-h-screen p-10 flex flex-col items-center justify-center">
                <h1 className="text-2xl text-yellow-400">Searching Live Deals for {city.toUpperCase()}...</h1>
                <p className="text-gray-500 mt-2">Connecting to Trip.com & Partners</p>
            </div>
        );
    }

    return (
        <div className="bg-black text-white min-h-screen p-10">
            {/* Social Mission Header */}
            <div className="max-w-4xl mx-auto mb-10 p-4 border-l-4 border-yellow-400 bg-yellow-400/5">
                <h2 className="text-yellow-400 font-bold">GTH Social Mission Active</h2>
                <p className="text-sm text-gray-400">1% of every booking via this page is automatically locked for Education Funds.</p>
            </div>

            <div className="grid gap-6 max-w-4xl mx-auto">

                {realHotels.map((hotel: any) => (

                    <div key={hotel.slug} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center hover:border-yellow-400/30 transition">
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-xl font-bold">{hotel.name}</h2>
                            <p className="text-gray-400 text-sm">{hotel.description}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Verified Partner</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-black text-white mb-1">{hotel.price} {hotel.currency}</div>
                            <a
                                href={hotel.partner_link}
                                target="_blank"
                                className="bg-yellow-400 text-black px-8 py-3 rounded-full font-extrabold hover:scale-105 transition block text-center"
                            >
                                VIEW DEAL
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}