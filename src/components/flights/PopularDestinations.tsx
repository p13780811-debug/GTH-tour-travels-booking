"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Destination = {
    name: string;
    price?: string;
    link?: string;
    currency?: string;
    destination?: string;
};

export default function PopularDestinations({
    destinations = [],
}: {
    destinations?: Destination[];
}) {
    const [images, setImages] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchImages = async () => {
            const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
            if (!apiKey) return;

            // Logic check: Cache check
            const cached = localStorage.getItem("dest_images");
            if (cached) {
                setImages(JSON.parse(cached));
                return;
            }

            try {
                // 🔥 Wahi logic wapas: Har destination ke liye alag call (Par caching ke sath safe hai)
                const results = await Promise.all(
                    destinations.map(async (dest) => {
                        try {
                            const res = await fetch(
                                `https://api.pexels.com/v1/search?query=${dest.name}&per_page=1`,
                                { headers: { Authorization: apiKey } }
                            );
                            const data = await res.json();
                            return {
                                name: dest.name,
                                image: data.photos.src.large || "/placeholder.jpg",
                            };
                        } catch {
                            return { name: dest.name, image: "/placeholder.jpg" };
                        }
                    })
                );

                const imgMap: any = {};
                results.forEach((r) => (imgMap[r.name] = r.image));
                setImages(imgMap);
                localStorage.setItem("dest_images", JSON.stringify(imgMap));
            } catch (err) {
                console.log("Image Fetch Error:", err);
            }
        };

        if (destinations.length > 0) fetchImages();
    }, [destinations]);

    if (!destinations || destinations.length === 0) return null;

    // 🔥 TERA ASLI CURRENCY LOGIC (Wapas Fix Kar Diya)
    const buildLink = (dest: Destination) => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = ("0" + (d.getMonth() + 1)).slice(-2);
        const dd = ("0" + d.getDate()).slice(-2);
        const today = `${yyyy}-${mm}-${dd}`;

        // 🚀 Purane return ko hata kar ye naya wala logic daal do
        const url = `https://www.aviasales.com/search?origin=DEL&destination=${dest.destination}&depart_date=${today}&with_request=true&marker=417668&currency=${dest.currency || "inr"}&locale=en`;

        return url;
    };

    return (
        <section className="py-20 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* HEADER */}
                <div className="mb-12 text-left">
                    <h2 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
                        Popular destinations
                    </h2>
                    <p className="text-gray-400 text-lg">from Delhi</p>
                </div>

                {/* SCROLL SECTION */}
                <div className="relative w-full [perspective:2000px]">
                    <div className="flex gap-8 animate-scroll hover:[animation-play-state:paused] py-6 px-4">

                        {[...destinations, ...destinations].map((dest, idx) => (
                            <a
                                key={idx}
                                href={buildLink(dest)}
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className="relative min-w-[280px] md:min-w-[340px] aspect-[4/3] rounded-[45px] overflow-hidden group border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-1000 [transform:rotateY(-15deg)] hover:[transform:rotateY(0deg)_scale(1.05)] hover:z-50 block"
                            >
                                {/* IMAGE */}
                                <Image
                                    src={images[dest.name] || "/placeholder.jpg"}
                                    alt={dest.name}
                                    fill
                                    className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                    unoptimized
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end">
                                    <h3 className="text-2xl font-black text-white uppercase italic leading-none mb-2">
                                        {dest.name}
                                    </h3>

                                    <div className="flex items-center gap-2">
                                        <span className="bg-sky-500 text-black text-[10px] font-black px-2 py-1 rounded">
                                            FLIGHTS
                                        </span>
                                        <span className="text-white font-bold text-sm uppercase">
                                            FROM {dest.price || "Best Deals"}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
  /* 1. Container ko 3D Room banao */
  section {
    perspective: 2000px;
  }

  
  @keyframes scroll {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-50%, 0, 0); }
  }

  .animate-scroll {
    display: flex;
    width: max-content;
    animation: scroll 80s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;

    transform-style: preserve-3d;
    padding-bottom: 40px;
  }

  
  .animate-scroll > a {
    
    transform: rotateY(-18deg) translateZ(0); 
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7);
    margin-right: -20px; /* Cards thoda ek dusre ke upar chadhe rahenge (Depth) */
  }

 
  .animate-scroll > a:hover {
    transform: rotateY(0deg) scale(1.1) translateZ(100px);
    margin-right: 20px;
    z-index: 100;
    box-shadow: 0 40px 80px -15px rgba(14, 165, 233, 0.4); /* Sky blue glow */
  }

  /* Mobile par tilt kam rakho taaki readable ho */
  @media (max-width: 768px) {
    .animate-scroll > a {
      transform: rotateY(-10deg);
    }
  }
`}</style>
        </section>
    );
}