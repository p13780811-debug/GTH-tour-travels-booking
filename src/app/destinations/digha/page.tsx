
import Link from "next/link";

export default function DighaSpecialPage() {
    return (
        <main className="bg-[#050505] min-h-screen text-white">


            {/* 1. HERO SECTION - Digha Elite Visual */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <img
                    src="/images/dighabus.jpg"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    alt="Digha Luxury Coast"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                <div className="relative z-10 text-center">
                    <span className="text-[#d4af37] font-bold tracking-[0.4em] text-xs uppercase mb-4 block">Exclusive Local Partner</span>
                    <h1 className="text-5xl md:text-7xl font-black gold-text uppercase">Digha Premium</h1>
                    <p className="mt-4 text-gray-400 italic">"Where the coast meets luxury documentary filmmaking."</p>
                </div>
            </section>

            {/* 2. THE 15-DAY VIDEO TOUR SECTION (The "Saan" of the business) */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            The 15-Day <span className="text-[#d4af37]">Cinematic</span> <br /> Journey Experience
                        </h2>
                        <p className="text-gray-400 text-lg font-light leading-relaxed">
                            Our local partner doesn't just provide a stay; they document your journey.
                            Experience a 15-day curated tour through the hidden coastal gems of Digha,
                            captured in high-definition video for you to cherish forever.
                        </p>
                        <ul className="space-y-4">
                            {['Professional Video Documentation', 'Private Luxury Transport', 'Local Hidden Spot Access', 'Gourmet Coastal Cuisine'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="h-1.5 w-1.5 bg-[#d4af37] rotate-45"></div> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* VIDEO PLAYER PLACEHOLDER */}
                    <div className="relative aspect-video bg-[#0a0a0a] rounded-2xl border border-[#d4af37]/20 flex items-center justify-center group overflow-hidden">
                        <img
                            src="/images/dighatempl.jpg"
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="relative z-10 h-20 w-20 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_30px_#d4af37] cursor-pointer">
                            <svg className="w-8 h-8 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                        <div className="absolute bottom-6 left-6 z-10">
                            <p className="text-[#d4af37] text-[10px] font-black tracking-widest uppercase">Watch Past Tour</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ULTRA PRO HOTEL COLLECTION --- */}
            <section className="bg-[#050505] py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-[#d4af37] text-[10px] font-black tracking-[0.4em] uppercase">Handpicked Stays</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mt-2">ELITE COASTAL <span className="gold-text">RETREATS</span></h2>
                        </div>
                        <p className="text-gray-500 text-xs hidden md:block max-w-[200px] text-right">Selected for their cinematic views and premium service.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Digha Elite Coast', price: '$450', img: '/images/dighahotel.jpg' },
                            { name: 'Marine Azure Resort', price: '$580', img: '/images/digharesort.jpg' },
                            { name: 'The Golden Sands', price: '$390', img: '/images/digharoom.jpg' },
                        ].map((hotel, i) => (
                            <div key={i} className="group relative bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/5 hover:border-[#d4af37]/30 transition-all duration-500">
                                {/* Image Container */}
                                <div className="relative h-[300px] overflow-hidden">
                                    <img
                                        src={`${hotel.img}?q=80&w=800`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                        alt={hotel.name}
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-[#d4af37] text-[10px] font-bold">{hotel.price}/Night</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors">{hotel.name}</h3>
                                        <div className="flex text-[#d4af37] text-[10px]">★★★★★</div>
                                    </div>

                                    <p className="text-gray-500 text-xs font-light leading-relaxed">
                                        Experience the pinnacle of luxury with private beach access and 24/7 butler service.
                                    </p>

                                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                        <span className="text-[9px] text-gray-400 uppercase tracking-widest">GTH Verified</span>
                                        <button className="text-[#d4af37] text-[10px] font-black uppercase tracking-tighter group-hover:translate-x-2 transition-transform">
                                            Book Stay →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}