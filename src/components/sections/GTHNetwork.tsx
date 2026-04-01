"use client";

import Image from "next/image";

type Partner = {
    name: string;
    image: string;
    link: string;
};

export default function GTHNetwork({ partners = [] }: { partners?: Partner[] }) {
    if (!partners || partners.length === 0) return null;

    return (
        <section className="py-12 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Heading */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-8 bg-sky-400"></div>
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
                        GTH <span className="text-white">Network</span>
                    </h2>
                </div>

                {/* Scroll Cards Container */}
                <div className="relative w-full [perspective:2000px]">
                    <div className="flex gap-6 hover:[animation-play-state:paused] py-4">

                        {[...partners, ...partners].map((p, idx) => (
                            <div
                                key={idx}
                                className="relative min-w-[280px] md:min-w-[340px] aspect-[16/10] rounded-2xl overflow-hidden group border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-700 [transform:rotateY(-10deg)] hover:[transform:rotateY(0deg)_scale(1.05)] hover:z-50"
                            >

                                {/* IMAGE */}
                                <Image
                                    src={p.image || "/placeholder.jpg"}
                                    alt={p.name || "Partner"}
                                    fill
                                    className="object-cover object-top opacity-60 group-hover:opacity-100 transition-all duration-500"
                                    unoptimized
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-6">

                                    <h3 className="font-bold text-white text-lg uppercase italic tracking-tight mb-1">
                                        GTH {p.name?.split(".")}
                                    </h3>

                                    <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mb-4">
                                        Verified Access
                                    </p>

                                    {/* 🔥 DYNAMIC LINK: Pointer-events ensure click works */}
                                    <a
                                        href={p.link || "#"}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="relative z-30 block w-full pointer-events-auto"
                                    >
                                        <button className="w-full py-2 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] text-white uppercase font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 hover:bg-sky-400 hover:text-black shadow-lg">
                                            View {p.name?.split(".")} Deal
                                        </button>
                                    </a>

                                </div>
                            </div>
                        ))}

                    </div>
                </div>

            </div>

            {/* Animation Logic */}
            <style jsx>{`
        @keyframes scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 45s linear infinite;
          transform-style: preserve-3d;
        }
      `}</style>
        </section>
    );
}