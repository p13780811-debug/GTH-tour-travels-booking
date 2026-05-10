"use client";
import { useRouter } from "next/navigation"
import { PropertyService } from "@/lib/real-estate/propertyService";

export default function PropertyCard({ p, onSelect, onLead }: any) {

    const router = useRouter()
    return (
        <div
            onClick={() => router.push(`/real-estate/${p.slug}`)}
            className="group relative bg-[#f1f5f9] border border-white rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-700 hover:-translate-y-3 hover:shadow-cyan-500/10"
        >
            {/* Property Image with Badge */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={p.image}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt={p.title}
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <p className="text-[9px] font-black text-white tracking-widest uppercase italic">Verified</p>
                </div>

                {/* 🚀 NEW: BOOST STATUS BADGE (Only shows if boosted) */}
                {p.is_featured && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg">
                        🔥 Featured
                    </div>
                )}
            </div>

            {/* Content Details */}
            <div className="p-8">
                <h3 className="font-black text-xl text-slate-900 tracking-tight italic uppercase group-hover:text-cyan-600 transition-colors leading-tight truncate">
                    {p.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest truncate">
                    {p.location}
                </p>

                {/* PRICE & ACTIONS */}
                <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <p className="text-2xl font-black text-slate-950 italic">
                            <span className="text-cyan-600 text-sm mr-1 not-italic">₹</span>
                            {p.price}
                        </p>

                        {/* 💰 ENQUIRE BUTTON */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLead(p.id);
                            }}
                            className="px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all 
           bg-[var(--btn-bg)] text-[var(--btn-text)] 
           shadow-[var(--btn-shadow)] 
           hover:scale-105 active:scale-95"
                        >
                            Enquire
                        </button>
                    </div>

                    {/* 🔥 GTH PRO: BOOST ACTION BUTTON */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await PropertyService.boostProperty(p.id, 24);
                                alert("Property boosted for 24 hours 🚀");
                                // Page refresh ya data reload yahan trigger kar sakte hain
                                window.location.reload();
                            } catch (err) {
                                alert("Boost failed. Check console.");
                            }
                        }}
                        className="w-full bg-yellow-400 text-black hover:gth-btn-gold py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 shadow-[0_10px_20px_rgba(250,204,21,0.2)] active:scale-95 flex items-center justify-center gap-2"
                    >
                        ⚡ Boost Visibility (₹199)
                    </button>
                </div>
            </div>

            {/* Subtle Interactive Line */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-cyan-500 transition-all duration-700 group-hover:w-full"></div>
        </div>
    );
}