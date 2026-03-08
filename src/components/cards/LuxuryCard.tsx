"use client"
import Link from "next/link"

interface Props {
    title: string
    description?: string
    price?: string
    image?: string
    slug: string
}

export default function LuxuryCard({
    title,
    description,
    price,
    image,
    slug
}: Props) {

    return (

        <Link
            href={`/destinations/${slug}`}
            className="group relative h-48 rounded-xl overflow-hidden border border-yellow-500/20 hover:border-yellow-500 transition"
        >

            {/* IMAGE */}

            <img
                src={image || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e`}
                alt={title}
                className="h-48 w-full object-cover group-hover:scale-110 transition duration-700"
            />

            {/* DARK OVERLAY */}

            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition duration-500"></div>

            {/* TOP PLACE NAME */}

            <div className="absolute top-3 left-3 text-yellow-400 text-lg font-semibold tracking-wide">
                {title}
            </div>

            {/* BOTTOM PRICE */}

            <div className="absolute bottom-3 left-3 text-white text-sm">

                <span className="text-gray-300 text-xs">
                    Starting from
                </span>

                <div className="text-yellow-400 font-bold">
                    ₹{price || "4,999"}
                </div>

            </div>

            {/* BUTTON */}

            <div className="absolute bottom-3 right-3">

                <span className="bg-yellow-500 text-black text-xs px-3 py-2 rounded-md font-semibold">
                    View →
                </span>

            </div>

        </Link>
    )
}